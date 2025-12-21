"use client";

import React, { useEffect, useState } from "react";
import { apiFetch, getApiBase } from "@/lib/api";

export default function UserAvatar({
	compact = false,
	size = 40,
}: {
	compact?: boolean; // if true, only show avatar circle
	size?: number;
}) {
	const [name, setName] = useState<string | null>(null);
	const [loading, setLoading] = useState<boolean>(false);

	useEffect(() => {
		let cancelled = false;

		const tryFromLocal = () => {
			try {
				const raw = localStorage.getItem("user");
				if (!raw) return null;
				const u = JSON.parse(raw);
				return u?.name || u?.fullName || u?.firstName || u?.email || null;
			} catch (e) {
				return null;
			}
		};

		const localName = tryFromLocal();
		if (localName) setName(localName);

		const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
		if (!token) return;

		setLoading(true);
		(async () => {
			try {
				const API_BASE = getApiBase();
				const res = await apiFetch(`${API_BASE}/api/users/profile`);
				if (!res.ok) return;
				const data = await res.json();
				if (!cancelled && data?.user) {
					const n = data.user.name || data.user.fullName || data.user.firstName || data.user.email;
					if (n) setName(n);
				}
			} catch (e) {
				// ignore
			} finally {
				if (!cancelled) setLoading(false);
			}
		})();

		return () => {
			cancelled = true;
		};
	}, []);

	const initial = (name && name.length) ? name.trim().charAt(0).toUpperCase() : "U";

	// deterministic color from name (simple hash)
	const colorFrom = (s?: string | null) => {
		if (!s) return "bg-blue-600";
		let h = 0;
		for (let i = 0; i < s.length; i++) {
			// tslint:disable-next-line: no-bitwise
			h = s.charCodeAt(i) + ((h << 5) - h);
		}
		const hue = Math.abs(h) % 360;
		return `hsl(${hue} 70% 45%)`;
	};

	const bgStyle: React.CSSProperties = {
		backgroundColor: colorFrom(name),
	};

	return (
		<div className={compact ? "flex items-center justify-center w-full" : "flex items-center gap-3"} title={name ?? undefined}>
			<div
				className="flex items-center justify-center rounded-full text-white font-semibold shadow"
				style={{ width: size, height: size, ...bgStyle }}
			>
				{initial}
			</div>
			{!compact && name && (
				<div className="flex flex-col text-white">
					<span className="text-sm font-semibold truncate max-w-[180px]">{name}</span>
				</div>
			)}
		</div>
	);
}

