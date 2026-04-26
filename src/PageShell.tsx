"use client";

import { motion } from "motion/react";
import { Bell, LogOut } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Separator } from "@/src/components/ui/separator";
import Link from "next/link";

interface PageShellProps {
	title: string;
	children: React.ReactNode;
}

export function PageShell({ title, children }: PageShellProps) {
	return (
		<div className="min-h-dvh bg-background">
			{/* ── Top bar ───────────────────────────────────────────────── */}
			<header className="sticky top-0 z-30 border-b border-border/40 bg-background/80 backdrop-blur-xl">
				<div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
					<div className="flex items-center gap-3">
						<Link href="/dashboard" className="flex items-center gap-3">
							<div className="flex size-8 items-center justify-center rounded-lg bg-primary">
								<svg
									width="18"
									height="18"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
									className="text-primary-foreground"
									role="img"
									aria-label="Salam logo"
								>
									<path d="M12 2L2 7l10 5 10-5-10-5Z" />
									<path d="M2 17l10 5 10-5" />
									<path d="M2 12l10 5 10-5" />
								</svg>
							</div>
							<span className="text-base font-semibold tracking-tight">
								Salam
							</span>
						</Link>
					</div>

					<div className="flex items-center gap-2">
						<Button
							variant="ghost"
							size="icon"
							className="cursor-pointer"
							aria-label="Notifications"
						>
							<Bell className="size-4" />
						</Button>
						<Separator orientation="vertical" className="mx-1 h-5" />
						<Button
							variant="ghost"
							size="icon"
							className="cursor-pointer"
							aria-label="Logout"
						>
							<LogOut className="size-4" />
						</Button>
					</div>
				</div>
			</header>

			{/* ── Content ───────────────────────────────────────────────── */}
			<main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
				<div className="space-y-6">
					<motion.div
						initial={{ opacity: 0, y: 16 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
					>
						<h1 className="text-2xl font-semibold tracking-tight">
							{title}
						</h1>
					</motion.div>
					{children}
				</div>
			</main>
		</div>
	);
}
