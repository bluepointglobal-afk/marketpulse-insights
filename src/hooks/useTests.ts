import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { TestResults } from "@/lib/mockData";

interface DbTest {
  id: string;
  user_id: string;
  product_name: string;
  product_description: string;
  category: string | null;
  target_market: string[];
  price_min: number | null;
  price_target: number | null;
  price_max: number | null;
  features: string[];
  smvs_enabled: boolean;
  smvs_config: Record<string, unknown> | null;
  bayesian_results: Record<string, unknown> | null;
  max_diff_results: Record<string, unknown> | null;
  kano_results: Record<string, unknown> | null;
  van_westendorp: Record<string, unknown> | null;
  brand_analysis: Record<string, unknown> | null;
  personas: Record<string, unknown>[] | null;
  status: "DRAFT" | "CONFIGURING" | "GENERATING" | "COMPLETED" | "FAILED";
  created_at: string;
  updated_at: string;
}

// Transform database test to frontend format
export function transformDbTest(dbTest: DbTest): TestResults {
  return {
    id: dbTest.id,
    name: dbTest.product_name,
    status: dbTest.status,
    createdAt: dbTest.created_at,
    productName: dbTest.product_name,
    productDescription: dbTest.product_description,
    category: dbTest.category || "HEALTH_SUPPLEMENTS",
    targetMarket: dbTest.target_market || [],
    priceMin: dbTest.price_min || 0,
    priceTarget: dbTest.price_target || 0,
    priceMax: dbTest.price_max || 0,
    features: dbTest.features || [],
    bayesianResults: dbTest.bayesian_results as TestResults["bayesianResults"] || {
      demandProbability: 0,
      psmScore: 0,
      optimalPrice: 0,
      confidenceInterval: [0, 0],
      demandCurve: [],
      regionalBreakdown: {},
      featureWeights: {}
    },
    maxDiffResults: dbTest.max_diff_results as TestResults["maxDiffResults"] || {
      mostImportant: { feature: "", utilityScore: 0, significance: "" },
      featureRanking: [],
      insight: ""
    },
    kanoResults: dbTest.kano_results as TestResults["kanoResults"] || {
      mustHave: [],
      performance: [],
      delighters: [],
      indifferent: []
    },
    vanWestendorp: dbTest.van_westendorp as TestResults["vanWestendorp"] || {
      tooExpensive: 0,
      expensive: 0,
      bargain: 0,
      tooCheap: 0,
      optimalPricePoint: 0,
      acceptableRange: [0, 0],
      reasoning: ""
    },
    brandAnalysis: dbTest.brand_analysis as TestResults["brandAnalysis"] || {
      yourPosition: { status: 0, trust: 0, upgrade: 0, overall: 0 },
      competitors: [],
      positioning: "",
      vulnerabilities: [],
      opportunities: []
    },
    personas: (dbTest.personas as unknown as TestResults["personas"]) || []
  };
}

export function useTests() {
  const { user } = useAuth();
  const [tests, setTests] = useState<TestResults[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTests = async () => {
    if (!user) {
      setTests([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("tests")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const transformedTests = (data as DbTest[]).map(transformDbTest);
      setTests(transformedTests);
    } catch (err) {
      console.error("Error fetching tests:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch tests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, [user]);

  const createTest = async (testData: {
    productName: string;
    productDescription: string;
    category: string;
    targetMarket: string[];
    priceMin: number;
    priceTarget: number;
    priceMax: number;
    features: string[];
  }) => {
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("tests")
      .insert({
        user_id: user.id,
        product_name: testData.productName,
        product_description: testData.productDescription,
        category: testData.category,
        target_market: testData.targetMarket,
        price_min: testData.priceMin,
        price_target: testData.priceTarget,
        price_max: testData.priceMax,
        features: testData.features,
        status: "DRAFT"
      })
      .select()
      .single();

    if (error) throw error;
    return data as DbTest;
  };

  const deleteTest = async (testId: string) => {
    const { error } = await supabase
      .from("tests")
      .delete()
      .eq("id", testId);

    if (error) throw error;
    setTests(tests.filter(t => t.id !== testId));
  };

  const getTest = async (testId: string) => {
    const { data, error } = await supabase
      .from("tests")
      .select("*")
      .eq("id", testId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;
    
    return transformDbTest(data as DbTest);
  };

  const generateAnalysis = async (testId: string, smvsConfig: {
    category: string;
    regions: Record<string, number>;
    identitySignals: Record<string, number>;
    pricing: { min: number; target: number; max: number };
    features: string[];
  }) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");

    const response = await supabase.functions.invoke("generate-analysis", {
      body: { testId, smvsConfig }
    });

    if (response.error) throw response.error;
    return response.data;
  };

  const retryGeneration = async (testId: string) => {
    // Get the test's smvs_config
    const { data: test, error: fetchError } = await supabase
      .from("tests")
      .select("smvs_config, category, target_market, price_min, price_target, price_max, features")
      .eq("id", testId)
      .single();

    if (fetchError || !test) throw new Error("Test not found");

    // Build smvsConfig from stored data or defaults
    const smvsConfig = test.smvs_config || {
      category: test.category || "HEALTH_SUPPLEMENTS",
      regions: { GCC: 0.6, MENA: 0.4 },
      identitySignals: { status: 0.5, trust: 0.5, upgrade: 0.5 },
      pricing: {
        min: test.price_min || 10,
        target: test.price_target || 50,
        max: test.price_max || 100
      },
      features: test.features || []
    };

    return generateAnalysis(testId, smvsConfig as {
      category: string;
      regions: Record<string, number>;
      identitySignals: Record<string, number>;
      pricing: { min: number; target: number; max: number };
      features: string[];
    });
  };

  const regenerateMarketing = async (testId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");

    const response = await supabase.functions.invoke("regenerate-marketing", {
      body: { testId }
    });

    if (response.error) throw response.error;
    return response.data;
  };

  return {
    tests,
    loading,
    error,
    fetchTests,
    createTest,
    deleteTest,
    getTest,
    generateAnalysis,
    retryGeneration,
    regenerateMarketing
  };
}
