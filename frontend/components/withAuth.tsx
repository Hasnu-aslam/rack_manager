"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { apiClient } from "@/lib/api";

export function withAuth<P extends object>(
    WrappedComponent: React.ComponentType<P>
) {
    return function WithAuth(props: P) {
        const router = useRouter();
        const pathname = usePathname();
        const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

        useEffect(() => {
            const checkAuth = async () => {
                const token = localStorage.getItem("access_token");
                const normalizedPathname = pathname.length > 1 && pathname.endsWith("/") 
                    ? pathname.slice(0, -1) 
                    : pathname;

                if (!token && ["/dashboard", "/inventory", "/billing", "/customers"].includes(normalizedPathname)) {
                    router.replace("/login");
                    return;
                }

                if (!token && normalizedPathname.startsWith("/super-admin")) {
                    router.replace("/super-admin/login");
                    return;
                }

                if (token && ["/dashboard", "/inventory", "/billing", "/customers", "/super-admin"].includes(normalizedPathname)) {
                    try {
                        const user = await apiClient.getCurrentUser();
                        
                        if (normalizedPathname === "/super-admin" && !user.is_superuser) {
                            router.replace("/dashboard");
                            return;
                        }
                        
                        if (normalizedPathname !== "/super-admin" && user.is_superuser) {
                            router.replace("/super-admin");
                            return;
                        }
                        
                        setIsAuthenticated(true);
                    } catch (err) {
                        console.error("Auth check failed:", err);
                        localStorage.removeItem("access_token");
                        router.replace("/login");
                    }
                } else {
                    setIsAuthenticated(true);
                }
            };
            
            checkAuth();
        }, [pathname, router]);

        // Don't render component until auth is checked
        if (isAuthenticated === null) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#E63946]"></div>
                </div>
            );
        }

        return <WrappedComponent {...props} />;
    };
}
