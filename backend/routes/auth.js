const express = require('express');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Helper function to generate access token
const generateAccessToken = (userId, email) => {
  return jwt.sign(
    { userId, email },
    process.env.JWT_SECRET,
    { expiresIn: '15m' } // Short-lived access token
  );
};

// Helper function to generate refresh token
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' } // Long-lived refresh token
  );
};

// Helper to send OTP via MojoAuth if API key/secret are configured.
// Returns the `state_id` string on success, or `false` on failure.
const sendOtpViaMojo = async (email) => {
  if (!process.env.MOJOAUTH_API_KEY || !process.env.MOJOAUTH_SECRET) return false;

  const url = process.env.MOJOAUTH_BASE_URL ? `${process.env.MOJOAUTH_BASE_URL}/users/emailotp` : 'https://api.mojoauth.com/users/emailotp';

  try {
    const resp = await axios.post(url, { email }, {
      headers: {
        'X-API-Key': process.env.MOJOAUTH_API_KEY,
        'X-API-Secret': process.env.MOJOAUTH_SECRET,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    if (resp.status === 200 && resp.data && resp.data.state_id) {
      return resp.data.state_id;
    }

    console.error('MojoAuth OTP send unexpected response:', resp.status, resp.data);
    return false;
  } catch (err) {
    console.error('MojoAuth OTP send failed (falling back):', err?.response?.data || err.message || err);
    return false;
  }
};

// Helper to verify OTP via MojoAuth using the returned `state_id` from the send call.
// Accepts `stateId` and `otp`, returns true when MojoAuth confirms authentication.
const verifyOtpViaMojo = async (stateId, otp) => {
  if (!process.env.MOJOAUTH_API_KEY || !process.env.MOJOAUTH_SECRET) return false;

  const url = process.env.MOJOAUTH_BASE_URL ? `${process.env.MOJOAUTH_BASE_URL}/users/emailotp/verify` : 'https://api.mojoauth.com/users/emailotp/verify';

  try {
    const resp = await axios.post(url, { state_id: stateId, otp }, {
      headers: {
        'X-API-Key': process.env.MOJOAUTH_API_KEY,
        'X-API-Secret': process.env.MOJOAUTH_SECRET,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    return resp.status === 200 && resp.data && resp.data.authenticated;
  } catch (err) {
    console.error('MojoAuth OTP verify failed:', err?.response?.data || err.message || err);
    return false;
  }
};

// @route   POST /api/auth/mojoauth/initiate
// @desc    Initiate MojoAuth authentication
// @access  Public
router.post('/mojoauth/initiate', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // MojoAuth API call to initiate authentication
    const response = await axios.post('https://api.mojoauth.com/users/magiclink', {
      email: email,
      redirect_url: process.env.MOJOAUTH_REDIRECT_URI
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.MOJOAUTH_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    res.json({
      message: 'Magic link sent successfully',
      state: response.data.state
    });
  } catch (error) {
    console.error('MojoAuth initiate error:', error);
    res.status(500).json({ error: 'Failed to initiate MojoAuth' });
  }
});

// @route   POST /api/auth/mojoauth/verify
// @desc    Verify MojoAuth token and authenticate user
// @access  Public
router.post('/mojoauth/verify', async (req, res) => {
  try {
    const { token, state } = req.body;

    if (!token || !state) {
      return res.status(400).json({ error: 'Token and state are required' });
    }

    // Verify MojoAuth token
    const response = await axios.post('https://api.mojoauth.com/users/verify', {
      token: token,
      state: state
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.MOJOAUTH_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const { user } = response.data;

    // Check if user exists
    let existingUser = await User.findOne({ email: user.email });

    if (!existingUser) {
      // Create new user
      existingUser = new User({
        name: user.name || user.email.split('@')[0],
        email: user.email,
        mojoAuthId: user.id,
        isVerified: true // MojoAuth accounts are pre-verified
      });
      await existingUser.save();
    } else {
      // Update MojoAuth ID if not set
      if (!existingUser.mojoAuthId) {
        existingUser.mojoAuthId = user.id;
        await existingUser.save();
      }
    }

    // Generate tokens
    const accessToken = generateAccessToken(existingUser._id, existingUser.email);
    const refreshToken = generateRefreshToken(existingUser._id);

    // Note: Refresh tokens are returned to client for client-side storage (localStorage)
    // Server-side persistence (RefreshToken model) intentionally not used (client-only flow)

    res.json({
      message: 'Authentication successful',
      accessToken,
      refreshToken,
      user: {
        id: existingUser._id,
        name: existingUser.name,
        email: existingUser.email
      }
    });
  } catch (error) {
    console.error('MojoAuth verify error:', error);
    res.status(500).json({ error: 'Failed to verify MojoAuth token' });
  }
});

// @route   POST /api/auth/google
// @desc    Authenticate with Google OAuth
// @access  Public
router.post('/google', async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: 'ID token is required' });
    }

    // Verify Google ID token
    const googleResponse = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);

    if (googleResponse.data.aud !== process.env.GOOGLE_CLIENT_ID) {
      return res.status(400).json({ error: 'Invalid token audience' });
    }

    const { sub: googleId, email, name, picture: avatar } = googleResponse.data;

    // Check if user already exists with this Google ID
    let user = await User.findOne({ googleId });

    if (user) {
      // User exists, generate tokens
      const accessToken = generateAccessToken(user._id, user.email);
      const refreshToken = generateRefreshToken(user._id);

      // Save refresh token to database
      // const refreshTokenDoc = new RefreshToken({
      //   token: refreshToken,
      //   user: user._id,
      //   expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      // });
      // await refreshTokenDoc.save();

      return res.json({
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar
        }
      });
    }

    // Check if user exists with same email
    user = await User.findOne({ email });

    if (user) {
      // Link Google account to existing user
      user.googleId = googleId;
      user.avatar = avatar || user.avatar;
      user.isVerified = true; // Google accounts are pre-verified
      await user.save();

      const accessToken = generateAccessToken(user._id, user.email);
      const refreshToken = generateRefreshToken(user._id);

      // Save refresh token to database
      // const refreshTokenDoc = new RefreshToken({
      //   token: refreshToken,
      //   user: user._id,
      //   expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      // });
      // await refreshTokenDoc.save();

      return res.json({
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar
        }
      });
    }

    // Create new user
    user = new User({
      name,
      email,
      googleId,
      avatar,
      isVerified: true // Google accounts are pre-verified
    });

    await user.save();

    const accessToken = generateAccessToken(user._id, user.email);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token to database
    // const refreshTokenDoc = new RefreshToken({
    //   token: refreshToken,
    //   user: user._id,
    //   expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    // });
    // await refreshTokenDoc.save();

    res.status(201).json({
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Google OAuth error:', error);
    if (error.response && error.response.status === 400) {
      return res.status(400).json({ error: 'Invalid Google token' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/auth/register
// @desc    Register a new user - request MojoAuth to send OTP
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, location } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Request MojoAuth to send OTP to the email (do not store OTP locally)
    const stateId = await sendOtpViaMojo(email);
    if (stateId) {
      return res.status(200).json({ message: 'OTP sent via MojoAuth', stateId });
    }

    // If MojoAuth send failed, return an informative error so frontend can show fallback
    return res.status(502).json({ error: 'Failed to send OTP via MojoAuth' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP and complete registration
// @access  Public
router.post('/verify-otp', async (req, res) => {
  try {
    const { otp, email, stateId, name, password, phone, location } = req.body;

    if (!stateId) {
      return res.status(400).json({ error: 'stateId is required for OTP verification' });
    }

    // Verify OTP using MojoAuth (no local DB checks)
    const verified = await verifyOtpViaMojo(stateId, otp);
    if (!verified) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Create or update user now that OTP is verified
    let user = await User.findOne({ email });
    if (user) {
      // Mark existing user as verified
      user.isVerified = true;
      // If a password was provided and the user doesn't have one, set it
      if (password && !user.password) {
        user.password = password;
      }
      await user.save();
    } else {
      user = new User({
        name,
        email,
        password,
        phone,
        location,
        isVerified: true
      });
      await user.save();
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id, user.email);
    const refreshToken = generateRefreshToken(user._id);

    res.status(201).json({
      message: 'User registered successfully',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        location: user.location,
        monthlyBudget: user.monthlyBudget,
        savingsGoal: user.savingsGoal,
        currentSavings: user.currentSavings,
        joinDate: user.joinDate
      }
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ error: 'Server error during verification' });
  }
});

// @route   POST /api/auth/resend-otp
// @desc    Resend OTP
// @access  Public
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;

    // Request MojoAuth to resend OTP (do not store OTP locally)
    const stateId = await sendOtpViaMojo(email);
    if (stateId) {
      return res.status(200).json({ message: 'OTP resent via MojoAuth', stateId });
    }

    console.error('Failed to resend OTP via MojoAuth');
    res.status(502).json({ error: 'Failed to resend OTP via MojoAuth' });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

      // If the account is linked to Google, instruct the client to use Google sign-in
      if (user.googleId) {
        return res.status(400).json({ error: 'This account was created with Google. Please sign in with Google.', requiresGoogleSignIn: true });
      }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(400).json({ error: 'Account is deactivated' });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id, user.email);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token to database
    // const refreshTokenDoc = new RefreshToken({
    //   token: refreshToken,
    //   user: user._id,
    //   expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    // });
    // await refreshTokenDoc.save();

    res.json({
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        location: user.location,
        monthlyBudget: user.monthlyBudget,
        savingsGoal: user.savingsGoal,
        currentSavings: user.currentSavings,
        joinDate: user.joinDate
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    // For now, just return success since tokens are in localStorage
    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Server error during logout' });
  }
});

// @route   POST /api/auth/refresh
// @desc    Refresh access token using refresh token
// @access  Public (but requires valid refresh token)
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token not provided' });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // For now, no DB check, just verify JWT
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const accessToken = generateAccessToken(user._id, user.email);

    res.json({
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;