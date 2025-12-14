import type { Category, PriorsFile } from '../../types';
import { PriorsFileZ } from './schema';

// Simple static loader with Zod validation
export async function loadPriorsForCategory(category: Category): Promise<PriorsFile> {
  let rawData: any;
  
  try {
    switch (category) {
      case 'HEALTH_SUPPLEMENTS':
        rawData = (await import('./health_supplements.v1.json')).default;
        break;
      case 'FOOD_SNACKS':
        rawData = (await import('./snacks.v1.json')).default;
        break;
      case 'FOOD_BEVERAGES':
        rawData = (await import('./beverages.v1.json')).default;
        break;
      case 'FOOD_FUNCTIONAL':
        console.log('⚠️ FOOD_FUNCTIONAL not yet available, using HEALTH_SUPPLEMENTS as proxy');
        rawData = (await import('./health_supplements.v1.json')).default;
        break;
      default:
        throw new Error(
          `No priors file for category: ${category}. ` +
          `Supported categories: HEALTH_SUPPLEMENTS, FOOD_SNACKS, FOOD_BEVERAGES. ` +
          `Please select a supported category or contact support to add "${category}".`
        );
    }
    
    // Validate with Zod
    const validated = PriorsFileZ.parse(rawData);
    
    console.log(`✅ Loaded priors: ${validated.category} v${validated.version}`);
    console.log(`   Tier: ${validated.priors[0].tier}`);
    console.log(`   Source: ${validated.priors[0].sourceLog.primary}`);
    
    return validated as PriorsFile;
    
  } catch (error: any) {
    if (error.name === 'ZodError') {
      console.error('❌ Priors file validation failed:', error.errors);
      throw new Error(
        `Invalid priors file format for ${category}. ` +
        `Schema validation failed. Please check priors file structure.`
      );
    }
    throw error;
  }
}

// Helper to find a specific prior
export function findPrior(file: PriorsFile, feature: string, region: string) {
  return file.priors.find(p => p.feature === feature && p.region === region);
}

// Helper to get all features for a region
export function getFeaturesForRegion(file: PriorsFile, region: string) {
  return file.priors.filter(p => p.region === region);
}
