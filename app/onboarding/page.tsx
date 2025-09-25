"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { domAnimation, LazyMotion, m } from "framer-motion";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useOnboardingStorage, type OnboardingData } from "@/hooks/use-onboarding-storage";
import OnboardingSidebar from "@/components/onboarding/onboarding-sidebar";
import EmailForm from "@/components/onboarding/email-form";
import PasswordForm from "@/components/onboarding/password-form";
import BasicInfoForm from "@/components/onboarding/basic-info-form";
import CompanyDetailsForm from "@/components/onboarding/company-details-form";
import PortfolioForm from "@/components/onboarding/portfolio-form";
import MarketingPreferenceForm from "@/components/onboarding/marketing-preference-form";
import TermsForm from "@/components/onboarding/terms-form";
import SuccessForm from "@/components/onboarding/success-form";
import { Spinner } from "@heroui/react";

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 100 : -100,
    opacity: 0,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 100 : -100,
    opacity: 0,
  }),
};

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const registerMutation = useMutation(api.auth.registerPropertyManager);
  const acceptInvitation = useMutation(api.invitations.accept);
  const invitationData = useQuery(api.invitations.getByToken, token ? { token } : "skip");

  const { formData, currentStep, setCurrentStep, updateFormData, clearStorage, isHydrated } = useOnboardingStorage();

  // Determine initial step based on token and stored step
  const getInitialStep = () => {
    // If we have a token, start at step 2
    if (token) return 2;
    // Otherwise check stored step or default to 1
    return currentStep || 1;
  };

  const [[page, direction], setPage] = useState([getInitialStep(), 0]);
  const [invitationProcessed, setInvitationProcessed] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Process invitation data when it's loaded
  useEffect(() => {
    if (invitationData && !invitationProcessed && isHydrated) {
      if (invitationData.isExpired) {
        // Handle expired invitation
        console.error('Invitation has expired');
        // Could redirect to an error page or show a message
      } else {
        // Prefill form data with invitation details
        updateFormData({
          email: invitationData.email,
          firstName: invitationData.firstName,
          lastName: invitationData.lastName,
          company: invitationData.companyName,
        });

        // If we have an email from the invitation, ensure we're on step 2
        if (invitationData.email) {
          setCurrentStep(2);
          setPage([2, 0]);
        }

        setInvitationProcessed(true);
      }
    }

    // Mark as initialized once we've processed invitation or if no token
    if (!token || invitationProcessed) {
      setIsInitialized(true);
    }
  }, [invitationData, invitationProcessed, updateFormData, isHydrated, token, setCurrentStep]);

  // Update page when currentStep changes (after hydration)
  // But don't override if we have a token (invitation flow)
  React.useEffect(() => {
    if (isHydrated && !token && currentStep !== page) {
      setPage([currentStep, 0]);
    }
  }, [isHydrated, currentStep, token, page]);

  const paginate = (newDirection: number) => {
    const newPage = page + newDirection;
    setPage([newPage, newDirection]);
    setCurrentStep(newPage);
  };

  const handleNext = async (data?: Partial<OnboardingData>) => {
    if (data) {
      updateFormData(data);
    }

    if (page === 7 && data?.termsAccepted) {
      // Before moving to success page, register the property manager
      try {
        const finalData = { ...formData, ...data };
        const result = await registerMutation({
          email: finalData.email!,
          password: finalData.password!,
          firstName: finalData.firstName!,
          lastName: finalData.lastName!,
          phone: finalData.phone!,
          company: finalData.company!,
          companyAddress: finalData.companyAddress!,
          propertiesManaged: finalData.propertiesManaged!,
          averageRent: finalData.averageRent!,
          marketingPreference: finalData.marketingPreference!,
          termsAccepted: finalData.termsAccepted!,
        });

        // If user came from an invitation, mark it as accepted
        if (token) {
          await acceptInvitation({ token });
        }

        // Store user in session for auto-login after onboarding
        sessionStorage.setItem("ryse-pm-user", JSON.stringify(result));
        paginate(1);
      } catch (error) {
        console.error("Registration failed:", error);
        // In production, show error to user
        return;
      }
    } else if (page === 8) {
      // Final step - clear storage and redirect to dashboard
      clearStorage();
      router.push("/dashboard");
    } else {
      paginate(1);
    }
  };

  const handleBack = () => {
    // If user came from invitation, don't allow going back to email step
    const minStep = token && invitationData?.email ? 2 : 1;
    if (page > minStep) {
      paginate(-1);
    }
  };

  const renderStep = () => {
    switch (page) {
      case 1:
        return (
          <EmailForm
            initialEmail={formData.email}
            onNext={handleNext}
          />
        );
      case 2:
        return (
          <PasswordForm
            email={formData.email!}
            initialPassword={formData.password}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 3:
        return (
          <BasicInfoForm
            initialData={{
              firstName: formData.firstName,
              lastName: formData.lastName,
              phone: formData.phone,
            }}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 4:
        return (
          <CompanyDetailsForm
            initialData={{
              company: formData.company,
              companyAddress: formData.companyAddress,
            }}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 5:
        return (
          <PortfolioForm
            initialData={{
              propertiesManaged: formData.propertiesManaged,
              averageRent: formData.averageRent,
            }}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 6:
        return (
          <MarketingPreferenceForm
            initialPreference={formData.marketingPreference}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 7:
        return (
          <TermsForm
            initialAccepted={formData.termsAccepted}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 8:
        return <SuccessForm />;
      default:
        return null;
    }
  };

  // Show a minimal loading state while determining initial setup
  if (token && !isInitialized && !invitationData) {
    return (
      <OnboardingSidebar currentStep={2}>
        <div className="w-full flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-3 border-primary-06 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-neutral-06">Loading invitation...</p>
          </div>
        </div>
      </OnboardingSidebar>
    );
  }

  return (
    <OnboardingSidebar currentStep={page}>
      <LazyMotion features={domAnimation}>
        <m.div
          key={page}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 },
          }}
          className="w-full"
        >
          {renderStep()}
        </m.div>
      </LazyMotion>
    </OnboardingSidebar>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Spinner size="lg" />
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}