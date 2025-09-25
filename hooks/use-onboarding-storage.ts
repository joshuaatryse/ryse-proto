import { useState, useEffect } from 'react';

const STORAGE_KEY = 'ryse-onboarding-data';
const STEP_KEY = 'ryse-onboarding-step';

export interface OnboardingData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  company: string;
  companyAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    fullAddress: string;
  };
  propertiesManaged: number;
  averageRent: number;
  marketingPreference: "automated" | "diy";
  termsAccepted: boolean;
}

export function useOnboardingStorage() {
  const [formData, setFormData] = useState<Partial<OnboardingData>>({});
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load data from sessionStorage after mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          setFormData(JSON.parse(stored));
        } catch (e) {
          console.error('Failed to parse stored onboarding data:', e);
        }
      }

      const storedStep = sessionStorage.getItem(STEP_KEY);
      if (storedStep) {
        const step = parseInt(storedStep, 10);
        if (!isNaN(step) && step >= 1 && step <= 8) {
          setCurrentStep(step);
        }
      }

      setIsHydrated(true);
    }
  }, []);

  // Save form data to session storage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    }
  }, [formData]);

  // Save current step to session storage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(STEP_KEY, currentStep.toString());
    }
  }, [currentStep]);

  const updateFormData = (data: Partial<OnboardingData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const clearStorage = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(STEP_KEY);
    }
    setFormData({});
    setCurrentStep(1);
  };

  return {
    formData,
    currentStep,
    setCurrentStep,
    updateFormData,
    clearStorage,
    isHydrated,
  };
}