import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Brain, Check } from "lucide-react";
import { loadingMessages } from "@/lib/mockData";
import { useTests } from "@/hooks/useTests";

const GeneratingTest = () => {
  const navigate = useNavigate();
  const { testId } = useParams();
  const location = useLocation();
  const { generateAnalysis } = useTests();
  const formData = location.state?.formData;
  
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [progress, setProgress] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!testId || !formData) {
      navigate("/dashboard");
      return;
    }

    // Start generation
    const runGeneration = async () => {
      if (isGenerating) return;
      setIsGenerating(true);

      try {
        await generateAnalysis(testId, {
          category: formData.category,
          regions: formData.regionWeights,
          identitySignals: formData.identitySignals,
          pricing: {
            min: formData.priceMin,
            target: formData.priceTarget,
            max: formData.priceMax
          },
          features: formData.features
        });

        // Navigate to results
        navigate(`/dashboard/test/${testId}/results`);
      } catch (error) {
        console.error("Generation failed:", error);
        navigate("/dashboard");
      }
    };

    // Delay to show animation
    const timer = setTimeout(runGeneration, 2000);
    return () => clearTimeout(timer);
  }, [testId, formData, navigate, generateAnalysis, isGenerating]);

  useEffect(() => {
    // Rotate through loading messages
    const messageInterval = setInterval(() => {
      setCurrentMessageIndex((prev) => {
        const next = prev + 1;
        if (next < loadingMessages.length) {
          setCompletedSteps((completed) => [...completed, prev]);
          return next;
        }
        return prev;
      });
    }, 3500);

    // Progress bar
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100;
        return prev + 3.5;
      });
    }, 1000);

    return () => {
      clearInterval(messageInterval);
      clearInterval(progressInterval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full text-center"
      >
        {/* Animated Brain */}
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div className="absolute inset-0 rounded-2xl gradient-bg animate-pulse shadow-glow" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Brain className="w-12 h-12 text-primary-foreground" />
          </div>
          <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s' }}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 w-2 h-2 rounded-full bg-primary" />
          </div>
          <div className="absolute inset-0 animate-spin" style={{ animationDuration: '4s', animationDirection: 'reverse' }}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3 w-1.5 h-1.5 rounded-full bg-pink" />
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-2">Analyzing Your Market</h2>
        <p className="text-muted-foreground mb-8">
          Our Bayesian engine is processing your inputs
        </p>

        {/* Progress bar */}
        <div className="relative h-2 bg-muted rounded-full overflow-hidden mb-8">
          <motion.div
            className="absolute inset-y-0 left-0 gradient-bg"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Steps */}
        <div className="space-y-3 text-left">
          {loadingMessages.slice(0, 6).map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ 
                opacity: index <= currentMessageIndex ? 1 : 0.3,
                x: 0
              }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-3"
            >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                completedSteps.includes(index)
                  ? 'gradient-bg'
                  : index === currentMessageIndex
                  ? 'border-2 border-primary'
                  : 'border-2 border-muted-foreground/30'
              }`}>
                {completedSteps.includes(index) && (
                  <Check className="w-3 h-3 text-primary-foreground" />
                )}
                {index === currentMessageIndex && !completedSteps.includes(index) && (
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                )}
              </div>
              <span className={`text-sm ${
                index <= currentMessageIndex ? 'text-foreground' : 'text-muted-foreground'
              }`}>
                {message}
              </span>
            </motion.div>
          ))}
        </div>

        <p className="text-sm text-muted-foreground mt-8">
          Estimated time: {Math.max(0, Math.round((100 - progress) / 3.5))} seconds
        </p>
      </motion.div>
    </div>
  );
};

export default GeneratingTest;
