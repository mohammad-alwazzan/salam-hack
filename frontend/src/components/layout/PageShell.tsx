"use client";

import { motion } from "motion/react";
import { Bell, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface PageShellProps {
	title: string;
	children: React.ReactNode;
	width?: "default" | "wide";
}

export function PageShell({ title, children, width = "default" }: PageShellProps) {
	const widthClass = width === "wide" ? "max-w-[1120px]" : "max-w-[760px]";

	return (
		<div className="min-h-dvh bg-background text-foreground">
			{/* ── Top bar ───────────────────────────────────────────────── */}
			<header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl">
				<div className={cn("mx-auto flex h-14 items-center justify-between px-4 md:px-6", widthClass)}>
					<div className="flex items-center gap-2">
						<Link href="/dashboard" className="flex items-center gap-2">
							<div className="size-6 rounded-full bg-primary" />
							<span className="text-sm font-medium tracking-tight">
								Mizan
							</span>
						</Link>
					</div>

					<div className="flex items-center gap-1">
						<Button
							variant="ghost"
							size="icon"
							className="size-8 cursor-pointer text-muted-foreground hover:text-foreground"
							aria-label="Notifications"
						>
							<Bell className="size-4" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className="size-8 cursor-pointer text-muted-foreground hover:text-foreground"
							aria-label="Logout"
						>
							<LogOut className="size-4" />
						</Button>
					</div>
				</div>
			</header>

			{/* ── Content ───────────────────────────────────────────────── */}
			<main className={cn("mx-auto px-4 py-8 md:px-6 md:py-10", widthClass)}>
				<div className="space-y-10">
					<motion.div
						initial={{ opacity: 0, y: 16 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
						className="space-y-1.5"
					>
						<h1 className="text-2xl font-bold tracking-tight">
							{title}
						</h1>
						<p className="text-sm text-muted-foreground">
							{format(new Date(), "EEEE, MMMM do")}
						</p>
					</motion.div>
					{children}
				</div>
			</main>
		</div>
	);
}
