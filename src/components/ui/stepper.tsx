
"use client";

import * as React from "react";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button, type ButtonProps } from "@/components/ui/button";

interface StepperProps extends React.HTMLAttributes<HTMLDivElement> {
  initialStep?: number;
  steps: {
    label: string;
    description?: string;
  }[];
}

interface StepProps extends React.ComponentProps<"div"> {
  label: string;
  description?: string;
}

const StepperContext = React.createContext<{
  currentStep: number;
  steps: { label: string }[];
  nextStep: () => void;
  prevStep: () => void;
  setStep: (step: number) => void;
} | null>(null);

function useStepper() {
  const context = React.useContext(StepperContext);
  if (!context) {
    throw new Error("useStepper must be used within a StepperProvider");
  }
  return context;
}

const Stepper = React.forwardRef<HTMLDivElement, StepperProps>(
  ({ initialStep = 0, steps, className, children, ...props }, ref) => {
    const [currentStep, setCurrentStep] = React.useState(initialStep);

    const nextStep = () => {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    };

    const prevStep = () => {
      if (currentStep > 0) {
        setCurrentStep(currentStep - 1);
      }
    };
    
    const setStep = (step: number) => {
        if (step >= 0 && step < steps.length) {
            setCurrentStep(step);
        }
    }

    const contextValue = { currentStep, steps, nextStep, prevStep, setStep };
    const stepChildren = React.Children.toArray(children);
    const currentStepComponent = stepChildren[currentStep];

    return (
      <StepperContext.Provider value={contextValue}>
        <div ref={ref} className={cn("flex w-full flex-col gap-6", className)} {...props}>
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <React.Fragment key={step.label}>
                <div className="flex flex-col items-center gap-2 text-center">
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full border-2",
                      index < currentStep ? "border-primary bg-primary text-primary-foreground" : "",
                      index === currentStep ? "border-primary" : "border-muted-foreground/30",
                    )}
                  >
                    {index < currentStep ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <span className={cn(index === currentStep && "text-primary")}>
                        {index + 1}
                      </span>
                    )}
                  </div>
                  <p className={cn(
                    "text-sm",
                    index === currentStep ? "font-semibold text-primary" : "text-muted-foreground"
                    )}>{step.label}</p>
                </div>
                {index < steps.length - 1 && <div className="flex-1 border-b-2 border-muted-foreground/30 -mb-7" />}
              </React.Fragment>
            ))}
          </div>
          <div>{currentStepComponent}</div>
        </div>
      </StepperContext.Provider>
    );
  }
);
Stepper.displayName = "Stepper";

const Step = React.forwardRef<HTMLDivElement, StepProps>(({ children }, ref) => {
  return <div ref={ref}>{children}</div>;
});
Step.displayName = "Step";

const StepperActions = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { currentStep, prevStep, steps } = useStepper();
    const isFirstStep = currentStep === 0;

    return (
      <div ref={ref} className={cn("flex justify-end gap-2", className)} {...props}>
        {!isFirstStep && <Button variant="outline" onClick={prevStep}>Back</Button>}
      </div>
    );
  }
);
StepperActions.displayName = "StepperActions";

const StepperNextButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (props, ref) => {
    const { nextStep } = useStepper();
    return <Button ref={ref} onClick={nextStep} {...props} />;
  }
);
StepperNextButton.displayName = "StepperNextButton";


export { Stepper, Step, useStepper, StepperActions, StepperNextButton };
