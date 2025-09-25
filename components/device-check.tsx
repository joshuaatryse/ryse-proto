"use client";

import React, { useEffect, useState } from "react";
import { Card, CardBody } from "@heroui/react";
import { Icon } from "@iconify/react";
import Image from "next/image";

export default function DeviceCheck({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkDevice = () => {
      // Check if window width is less than 1024px (desktop breakpoint)
      const isSmallScreen = window.innerWidth < 1024;

      // Also check user agent for mobile/tablet detection
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      const isTablet = /(ipad|tablet|playbook|silk)|(android(?!.*mobile))/i.test(userAgent);

      setIsMobile(isSmallScreen || isMobileDevice || isTablet);
      setIsLoading(false);
    };

    checkDevice();

    // Add resize listener to detect orientation changes
    window.addEventListener('resize', checkDevice);

    return () => {
      window.removeEventListener('resize', checkDevice);
    };
  }, []);

  if (isLoading) {
    return null; // Or a loading spinner if preferred
  }

  if (isMobile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-01 via-white to-secondary-01 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-xl border-0">
          <CardBody className="text-center py-12 px-6">
            {/* Logo */}
            <div className="mb-8">
              <Image
                src="/nomad.svg"
                alt="Nomad"
                width={150}
                height={50}
                className="mx-auto"
              />
            </div>

            {/* Desktop Icon */}
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-01 rounded-full">
                <Icon icon="solar:monitor-bold" className="text-4xl text-primary-06" />
              </div>
            </div>

            {/* Message */}
            <h1 className="text-2xl font-bold text-neutral-08 mb-3">
              Desktop View Required
            </h1>
            <p className="text-neutral-06 mb-6">
              For the best experience and full functionality, please access Ryse from a desktop or laptop computer.
            </p>

            {/* Device icons */}
            <div className="flex justify-center gap-6 mb-6">
              <div className="flex flex-col items-center gap-2">
                <div className="p-3 bg-danger-50 rounded-lg">
                  <Icon icon="solar:smartphone-bold" className="text-2xl text-danger-600" />
                </div>
                <span className="text-xs text-neutral-05">Phone</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="p-3 bg-danger-50 rounded-lg">
                  <Icon icon="solar:tablet-bold" className="text-2xl text-danger-600" />
                </div>
                <span className="text-xs text-neutral-05">Tablet</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="p-3 bg-success-50 rounded-lg">
                  <Icon icon="solar:laptop-bold" className="text-2xl text-success-600" />
                </div>
                <span className="text-xs text-neutral-05">Desktop</span>
              </div>
            </div>

            {/* Additional info */}
            <div className="bg-neutral-01 rounded-lg p-4 text-left">
              <p className="text-xs text-neutral-06 leading-relaxed">
                <strong>Why desktop?</strong> Our platform includes advanced features like document signing,
                property management tools, and financial dashboards that are optimized for larger screens.
              </p>
            </div>

            {/* Contact */}
            <p className="text-xs text-neutral-05 mt-6">
              Need help? Contact support at{" "}
              <a href="mailto:support@rysemarket.com" className="text-primary-06 hover:underline">
                support@rysemarket.com
              </a>
            </p>
          </CardBody>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}