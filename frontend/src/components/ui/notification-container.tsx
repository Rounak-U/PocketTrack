"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNotifications, NotificationType } from './notification-context';

const getIcon = (type: NotificationType) => {
  switch (type) {
    case 'success':
      return CheckCircle;
    case 'error':
      return AlertCircle;
    case 'warning':
      return AlertTriangle;
    case 'info':
      return Info;
    default:
      return Info;
  }
};

const getStyles = (type: NotificationType) => {
  switch (type) {
    case 'success':
      return {
        container: 'bg-emerald-500/10 border-emerald-500/20',
        icon: 'text-emerald-400',
        title: 'text-emerald-100',
        message: 'text-emerald-200/80',
      };
    case 'error':
      return {
        container: 'bg-red-500/10 border-red-500/20',
        icon: 'text-red-400',
        title: 'text-red-100',
        message: 'text-red-200/80',
      };
    case 'warning':
      return {
        container: 'bg-amber-500/10 border-amber-500/20',
        icon: 'text-amber-400',
        title: 'text-amber-100',
        message: 'text-amber-200/80',
      };
    case 'info':
      return {
        container: 'bg-blue-500/10 border-blue-500/20',
        icon: 'text-blue-400',
        title: 'text-blue-100',
        message: 'text-blue-200/80',
      };
    default:
      return {
        container: 'bg-gray-500/10 border-gray-500/20',
        icon: 'text-gray-400',
        title: 'text-gray-100',
        message: 'text-gray-200/80',
      };
  }
};

export const NotificationContainer: React.FC = () => {
  const { notifications, removeNotification } = useNotifications();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {notifications.map((notification) => {
          const Icon = getIcon(notification.type);
          const styles = getStyles(notification.type);

          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 300, scale: 0.3 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 300, scale: 0.5, transition: { duration: 0.2 } }}
              transition={{
                type: 'spring',
                stiffness: 500,
                damping: 40,
                mass: 1,
              }}
              className={cn(
                'flex items-start gap-3 p-4 rounded-xl border backdrop-blur-xl shadow-lg max-w-sm',
                styles.container
              )}
            >
              <Icon className={cn('w-5 h-5 mt-0.5 flex-shrink-0', styles.icon)} />
              <div className="flex-1 min-w-0">
                <h4 className={cn('font-semibold text-sm', styles.title)}>
                  {notification.title}
                </h4>
                {notification.message && (
                  <p className={cn('text-xs mt-1 leading-relaxed', styles.message)}>
                    {notification.message}
                  </p>
                )}
              </div>
              <button
                onClick={() => removeNotification(notification.id)}
                className="flex-shrink-0 p-1 rounded-md hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4 text-white/60 hover:text-white" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};