import { CheckCircle2, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type TutorialPhase = "idle" | "intro" | "steps" | "outro" | "complete";

interface TutorialStepsTrackerProps {
  steps: string[];
  currentPhase: TutorialPhase;
  currentStepIndex: number;
  isNarrating: boolean;
  dense?: boolean;
}

export function TutorialStepsTracker({
  steps,
  currentPhase,
  currentStepIndex,
  isNarrating,
  dense = false,
}: TutorialStepsTrackerProps) {
  return (
    <div className={cn("space-y-2", dense && "space-y-1")}> 
      <h4 className="font-medium text-sm flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-primary" />
        Progression du tutoriel
      </h4>
      <div className={cn("grid gap-2", dense && "gap-1")}> 
        {steps.map((step, idx) => {
          const isDone =
            (currentPhase === "steps" && idx < currentStepIndex) || currentPhase === "complete";
          const isActive = currentPhase === "steps" && idx === currentStepIndex;

          return (
            <div
              key={idx}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border transition-all",
                dense && "p-2",
                isDone
                  ? "bg-success/10 border-success/30"
                  : isActive
                    ? "bg-primary/10 border-primary/30 scale-[1.01]"
                    : "bg-muted/30 border-transparent",
              )}
            >
              <div
                className={cn(
                  "h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                  dense && "h-6 w-6",
                  isDone
                    ? "bg-success text-success-foreground"
                    : isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {isDone ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
              </div>

              <span
                className={cn(
                  "text-sm font-medium",
                  dense && "text-xs",
                  isDone || isActive
                    ? "text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {step}
              </span>

              {isActive && isNarrating && (
                <div className="ml-auto animate-pulse">
                  <Volume2 className="h-4 w-4 text-primary" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
