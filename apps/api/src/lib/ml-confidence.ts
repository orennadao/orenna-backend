import { PrismaClient } from '@orenna/db';

export interface AnomalyDetectionResult {
  isAnomaly: boolean;
  anomalyScore: number; // 0-1, higher = more anomalous
  anomalyType: string[];
  confidence: number; // Adjusted confidence after anomaly detection
  reasons: string[];
  recommendedAction: 'approve' | 'review' | 'reject' | 'investigate';
}

export interface DataPattern {
  feature: string;
  expectedRange: { min: number; max: number };
  historicalMean: number;
  historicalStdDev: number;
  weight: number; // Importance in overall scoring
}

export interface VerificationFeatures {
  // Water measurement features
  waterVolume: number;
  baselineVolume: number;
  netBenefit: number;
  benefitPerHectare: number;
  
  // Temporal features
  measurementPeriod: number; // days
  seasonalityFactor: number; // 0-1
  timeSinceLastMeasurement: number; // hours
  
  // Location features
  latitude: number;
  longitude: number;
  watershedId?: string;
  proximityToOtherProjects: number; // km to nearest project
  
  // Evidence features
  evidenceCount: number;
  evidenceQualityScore: number; // 0-1
  evidenceConsistency: number; // 0-1
  evidenceDiversity: number; // number of different evidence types
  
  // Project features
  projectAge: number; // days since project start
  projectType: string;
  projectScale: number; // hectares or volume
  historicalSuccessRate: number; // 0-1
  
  // External validation features
  iotSensorCount: number;
  satelliteObservations: number;
  governmentDataPoints: number;
  weatherStationDistance: number; // km
  
  // Statistical features
  dataUncertainty: number; // 0-1
  measurementConsistency: number; // coefficient of variation
  crossValidationScore: number; // 0-1
}

export class MLConfidenceScorer {
  private patterns: Map<string, DataPattern[]> = new Map();
  private anomalyThresholds = {
    mild: 0.3,
    moderate: 0.6,
    severe: 0.8
  };

  constructor(private prisma: PrismaClient) {
    this.initializePatterns();
  }

  private initializePatterns() {
    // VWBA patterns based on industry standards and historical data
    const vwbaPatterns: DataPattern[] = [
      {
        feature: 'netBenefit',
        expectedRange: { min: 0, max: 50000000 }, // m³ per year
        historicalMean: 1500000,
        historicalStdDev: 800000,
        weight: 0.25
      },
      {
        feature: 'benefitPerHectare',
        expectedRange: { min: 0, max: 10000 }, // m³/hectare
        historicalMean: 2500,
        historicalStdDev: 1200,
        weight: 0.20
      },
      {
        feature: 'measurementPeriod',
        expectedRange: { min: 30, max: 365 }, // days
        historicalMean: 90,
        historicalStdDev: 30,
        weight: 0.15
      },
      {
        feature: 'evidenceQualityScore',
        expectedRange: { min: 0.5, max: 1.0 },
        historicalMean: 0.85,
        historicalStdDev: 0.12,
        weight: 0.20
      },
      {
        feature: 'dataUncertainty',
        expectedRange: { min: 0, max: 0.3 }, // Max 30% uncertainty
        historicalMean: 0.08,
        historicalStdDev: 0.05,
        weight: 0.20
      }
    ];

    this.patterns.set('vwba-v2', vwbaPatterns);
    this.patterns.set('vwba-v1', vwbaPatterns); // Similar patterns for v1
  }

  async analyzeVerification(
    methodId: string,
    features: VerificationFeatures,
    baseConfidence: number
  ): Promise<AnomalyDetectionResult> {
    const patterns = this.patterns.get(methodId);
    if (!patterns) {
      return {
        isAnomaly: false,
        anomalyScore: 0,
        anomalyType: [],
        confidence: baseConfidence,
        reasons: ['No ML patterns available for this method'],
        recommendedAction: 'review'
      };
    }

    // Update patterns with recent data
    await this.updatePatternsFromHistory(methodId);

    // Detect anomalies
    const anomalyResults = this.detectAnomalies(features, patterns);
    
    // Calculate temporal anomalies
    const temporalAnomalies = await this.detectTemporalAnomalies(features);
    
    // Calculate spatial anomalies
    const spatialAnomalies = await this.detectSpatialAnomalies(features);
    
    // Combine all anomaly scores
    const combinedAnomalyScore = this.combineAnomalyScores([
      anomalyResults.anomalyScore,
      temporalAnomalies.anomalyScore,
      spatialAnomalies.anomalyScore
    ]);

    const allAnomalyTypes = [
      ...anomalyResults.anomalyTypes,
      ...temporalAnomalies.anomalyTypes,
      ...spatialAnomalies.anomalyTypes
    ];

    const allReasons = [
      ...anomalyResults.reasons,
      ...temporalAnomalies.reasons,
      ...spatialAnomalies.reasons
    ];

    // Adjust confidence based on anomaly score
    const adjustedConfidence = this.adjustConfidenceForAnomalies(
      baseConfidence,
      combinedAnomalyScore,
      features
    );

    // Determine recommended action
    const recommendedAction = this.determineRecommendedAction(
      adjustedConfidence,
      combinedAnomalyScore,
      allAnomalyTypes
    );

    const isAnomaly = combinedAnomalyScore > this.anomalyThresholds.mild;

    return {
      isAnomaly,
      anomalyScore: combinedAnomalyScore,
      anomalyType: allAnomalyTypes,
      confidence: adjustedConfidence,
      reasons: allReasons,
      recommendedAction
    };
  }

  private detectAnomalies(
    features: VerificationFeatures, 
    patterns: DataPattern[]
  ): { anomalyScore: number; anomalyTypes: string[]; reasons: string[] } {
    let totalAnomalyScore = 0;
    let totalWeight = 0;
    const anomalyTypes: string[] = [];
    const reasons: string[] = [];

    for (const pattern of patterns) {
      const featureValue = this.getFeatureValue(features, pattern.feature);
      if (featureValue === null) continue;

      // Z-score anomaly detection
      const zScore = Math.abs(featureValue - pattern.historicalMean) / pattern.historicalStdDev;
      const featureAnomalyScore = Math.min(zScore / 3, 1); // Normalize to 0-1

      // Range check
      const isOutOfRange = featureValue < pattern.expectedRange.min || 
                          featureValue > pattern.expectedRange.max;

      if (isOutOfRange) {
        anomalyTypes.push(`${pattern.feature}_out_of_range`);
        reasons.push(`${pattern.feature} value ${featureValue} is outside expected range [${pattern.expectedRange.min}, ${pattern.expectedRange.max}]`);
      }

      if (zScore > 2) { // 2 standard deviations
        anomalyTypes.push(`${pattern.feature}_statistical_outlier`);
        reasons.push(`${pattern.feature} value ${featureValue} is ${zScore.toFixed(1)} standard deviations from historical mean`);
      }

      totalAnomalyScore += featureAnomalyScore * pattern.weight;
      totalWeight += pattern.weight;
    }

    const anomalyScore = totalWeight > 0 ? totalAnomalyScore / totalWeight : 0;

    return { anomalyScore, anomalyTypes, reasons };
  }

  private async detectTemporalAnomalies(
    features: VerificationFeatures
  ): Promise<{ anomalyScore: number; anomalyTypes: string[]; reasons: string[] }> {
    const anomalyTypes: string[] = [];
    const reasons: string[] = [];
    let anomalyScore = 0;

    // Check for rapid successive verifications
    if (features.timeSinceLastMeasurement < 24) { // Less than 24 hours
      anomalyScore += 0.3;
      anomalyTypes.push('rapid_verification');
      reasons.push('Verification submitted less than 24 hours after previous measurement');
    }

    // Check for unusual seasonal patterns
    const currentMonth = new Date().getMonth();
    const isDrySeasonClaim = features.seasonalityFactor < 0.3 && features.netBenefit > features.waterVolume * 0.8;
    
    if (isDrySeasonClaim && [5, 6, 7, 8, 9].includes(currentMonth)) { // Dry season months (example)
      anomalyScore += 0.4;
      anomalyTypes.push('seasonal_inconsistency');
      reasons.push('High water benefit claim during typical dry season');
    }

    // Check measurement period consistency
    if (features.measurementPeriod < 30) {
      anomalyScore += 0.2;
      anomalyTypes.push('insufficient_measurement_period');
      reasons.push('Measurement period too short for reliable water assessment');
    }

    return { 
      anomalyScore: Math.min(anomalyScore, 1), 
      anomalyTypes, 
      reasons 
    };
  }

  private async detectSpatialAnomalies(
    features: VerificationFeatures
  ): Promise<{ anomalyScore: number; anomalyTypes: string[]; reasons: string[] }> {
    const anomalyTypes: string[] = [];
    const reasons: string[] = [];
    let anomalyScore = 0;

    // Check for geographical clustering of high-value claims
    if (features.proximityToOtherProjects < 5 && features.netBenefit > 10000000) {
      anomalyScore += 0.3;
      anomalyTypes.push('geographical_clustering');
      reasons.push('High-value claim in area with other recent projects (potential double-counting)');
    }

    // Check for water availability in region
    const isAridRegion = this.isAridRegion(features.latitude, features.longitude);
    if (isAridRegion && features.benefitPerHectare > 5000) {
      anomalyScore += 0.4;
      anomalyTypes.push('arid_region_high_claim');
      reasons.push('Unusually high water benefit claim for arid region');
    }

    // Check for data source availability
    const hasLocalValidation = features.iotSensorCount > 0 || 
                              features.governmentDataPoints > 0 || 
                              features.weatherStationDistance < 50;
    
    if (!hasLocalValidation && features.netBenefit > 5000000) {
      anomalyScore += 0.2;
      anomalyTypes.push('limited_local_validation');
      reasons.push('Large water benefit claim with limited local data validation');
    }

    return { 
      anomalyScore: Math.min(anomalyScore, 1), 
      anomalyTypes, 
      reasons 
    };
  }

  private combineAnomalyScores(scores: number[]): number {
    // Use weighted average with emphasis on highest score
    const maxScore = Math.max(...scores);
    const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    // Weighted combination: 70% max score, 30% average
    return Math.min(maxScore * 0.7 + avgScore * 0.3, 1);
  }

  private adjustConfidenceForAnomalies(
    baseConfidence: number,
    anomalyScore: number,
    features: VerificationFeatures
  ): number {
    // Start with base confidence
    let adjustedConfidence = baseConfidence;

    // Apply anomaly penalty
    const anomalyPenalty = anomalyScore * 0.5; // Max 50% reduction
    adjustedConfidence -= anomalyPenalty;

    // Apply evidence quality boost
    if (features.evidenceQualityScore > 0.9) {
      adjustedConfidence += 0.05; // 5% boost for excellent evidence
    }

    // Apply external validation boost
    if (features.iotSensorCount > 0 && features.governmentDataPoints > 0) {
      adjustedConfidence += 0.1; // 10% boost for multiple validation sources
    }

    // Apply uncertainty penalty
    adjustedConfidence -= features.dataUncertainty * 0.3;

    // Ensure confidence stays within bounds
    return Math.max(0, Math.min(1, adjustedConfidence));
  }

  private determineRecommendedAction(
    confidence: number,
    anomalyScore: number,
    anomalyTypes: string[]
  ): 'approve' | 'review' | 'reject' | 'investigate' {
    // Critical anomalies require investigation
    const hasCriticalAnomaly = anomalyTypes.some(type => 
      type.includes('out_of_range') || 
      type.includes('geographical_clustering') ||
      type.includes('rapid_verification')
    );

    if (hasCriticalAnomaly || anomalyScore > this.anomalyThresholds.severe) {
      return 'investigate';
    }

    // High confidence with low anomaly score
    if (confidence > 0.85 && anomalyScore < this.anomalyThresholds.mild) {
      return 'approve';
    }

    // Low confidence or moderate anomalies
    if (confidence < 0.6 || anomalyScore > this.anomalyThresholds.moderate) {
      return 'reject';
    }

    // Everything else needs review
    return 'review';
  }

  private getFeatureValue(features: VerificationFeatures, featureName: string): number | null {
    const value = (features as any)[featureName];
    return typeof value === 'number' ? value : null;
  }

  private isAridRegion(latitude: number, longitude: number): boolean {
    // Simplified arid region detection
    // In practice, this would use a comprehensive climate database
    
    // Desert regions (very simplified)
    const aridRegions = [
      { lat: [15, 35], lon: [-20, 60] }, // Sahara/Middle East
      { lat: [-35, -15], lon: [110, 160] }, // Australian deserts
      { lat: [20, 40], lon: [-125, -100] }, // Southwestern US
      { lat: [-30, -20], lon: [-70, -50] } // Atacama
    ];

    return aridRegions.some(region => 
      latitude >= region.lat[0] && latitude <= region.lat[1] &&
      longitude >= region.lon[0] && longitude <= region.lon[1]
    );
  }

  private async updatePatternsFromHistory(methodId: string): Promise<void> {
    // Get recent successful verifications for this method
    const recentVerifications = await this.prisma.verificationResult.findMany({
      where: {
        methodId,
        verified: true,
        createdAt: { gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) } // Last 6 months
      },
      include: {
        evidenceFiles: true,
        liftToken: {
          include: { project: true }
        }
      },
      take: 1000
    });

    if (recentVerifications.length < 10) return; // Need minimum sample size

    // Calculate updated statistics for each pattern
    const patterns = this.patterns.get(methodId);
    if (!patterns) return;

    for (const pattern of patterns) {
      const values = recentVerifications
        .map(verification => this.extractFeatureFromVerification(verification, pattern.feature))
        .filter(value => value !== null) as number[];

      if (values.length > 0) {
        // Update historical mean and standard deviation
        pattern.historicalMean = values.reduce((sum, val) => sum + val, 0) / values.length;
        
        const variance = values.reduce((sum, val) => 
          sum + Math.pow(val - pattern.historicalMean, 2), 0
        ) / values.length;
        
        pattern.historicalStdDev = Math.sqrt(variance);

        // Update expected range (5th to 95th percentile)
        const sortedValues = values.sort((a, b) => a - b);
        const p5Index = Math.floor(sortedValues.length * 0.05);
        const p95Index = Math.floor(sortedValues.length * 0.95);
        
        pattern.expectedRange = {
          min: sortedValues[p5Index],
          max: sortedValues[p95Index]
        };
      }
    }
  }

  private extractFeatureFromVerification(verification: any, featureName: string): number | null {
    // Extract specific features from verification data
    // This would be expanded based on available verification data structure
    
    switch (featureName) {
      case 'evidenceQualityScore':
        // Calculate based on evidence files
        if (!verification.evidenceFiles?.length) return 0;
        const qualitySum = verification.evidenceFiles.reduce((sum: number, file: any) => {
          // Simple quality score based on file size and type
          const sizeScore = Math.min(file.fileSize / (10 * 1024 * 1024), 1); // Up to 10MB is good
          const typeScore = ['WATER_MEASUREMENT_DATA', 'BASELINE_ASSESSMENT'].includes(file.evidenceType) ? 1 : 0.7;
          return sum + (sizeScore * typeScore);
        }, 0);
        return qualitySum / verification.evidenceFiles.length;

      case 'evidenceCount':
        return verification.evidenceFiles?.length || 0;

      case 'measurementPeriod':
        // Would extract from verification metadata
        return 90; // Default value

      case 'dataUncertainty':
        // Would calculate from verification calculations
        return 0.1; // Default value

      default:
        return null;
    }
  }

  async generateConfidenceReport(
    verificationResultId: number
  ): Promise<{
    baseConfidence: number;
    mlAnalysis: AnomalyDetectionResult;
    finalConfidence: number;
    riskFactors: string[];
    mitigationSuggestions: string[];
  }> {
    const verification = await this.prisma.verificationResult.findUnique({
      where: { id: verificationResultId },
      include: {
        evidenceFiles: true,
        liftToken: {
          include: { project: true }
        }
      }
    });

    if (!verification) {
      throw new Error('Verification result not found');
    }

    // Extract features (simplified)
    const features: VerificationFeatures = {
      waterVolume: 1000000, // Would extract from verification data
      baselineVolume: 500000,
      netBenefit: 500000,
      benefitPerHectare: 2500,
      measurementPeriod: 90,
      seasonalityFactor: 0.8,
      timeSinceLastMeasurement: 168, // 1 week
      latitude: 0, // Would extract from project location
      longitude: 0,
      proximityToOtherProjects: 15,
      evidenceCount: verification.evidenceFiles?.length || 0,
      evidenceQualityScore: 0.85,
      evidenceConsistency: 0.9,
      evidenceDiversity: 3,
      projectAge: 365,
      projectType: 'water_conservation',
      projectScale: 200,
      historicalSuccessRate: 0.85,
      iotSensorCount: 0,
      satelliteObservations: 2,
      governmentDataPoints: 1,
      weatherStationDistance: 25,
      dataUncertainty: 0.08,
      measurementConsistency: 0.92,
      crossValidationScore: 0.88
    };

    const baseConfidence = verification.confidenceScore?.toNumber() || 0.5;
    const mlAnalysis = await this.analyzeVerification(
      verification.methodId,
      features,
      baseConfidence
    );

    // Generate risk factors and mitigation suggestions
    const riskFactors = this.identifyRiskFactors(features, mlAnalysis);
    const mitigationSuggestions = this.generateMitigationSuggestions(features, mlAnalysis);

    return {
      baseConfidence,
      mlAnalysis,
      finalConfidence: mlAnalysis.confidence,
      riskFactors,
      mitigationSuggestions
    };
  }

  private identifyRiskFactors(
    features: VerificationFeatures,
    mlAnalysis: AnomalyDetectionResult
  ): string[] {
    const riskFactors: string[] = [];

    if (features.evidenceCount < 3) {
      riskFactors.push('Insufficient evidence files');
    }

    if (features.dataUncertainty > 0.15) {
      riskFactors.push('High measurement uncertainty');
    }

    if (features.iotSensorCount === 0 && features.governmentDataPoints === 0) {
      riskFactors.push('No external validation sources');
    }

    if (mlAnalysis.anomalyScore > 0.5) {
      riskFactors.push('Anomalous verification patterns detected');
    }

    if (features.measurementPeriod < 60) {
      riskFactors.push('Short measurement period');
    }

    return riskFactors;
  }

  private generateMitigationSuggestions(
    features: VerificationFeatures,
    mlAnalysis: AnomalyDetectionResult
  ): string[] {
    const suggestions: string[] = [];

    if (features.evidenceCount < 5) {
      suggestions.push('Collect additional evidence files, especially water measurement data');
    }

    if (features.iotSensorCount === 0) {
      suggestions.push('Install IoT sensors for continuous water monitoring');
    }

    if (features.governmentDataPoints === 0) {
      suggestions.push('Cross-reference with official government water data');
    }

    if (mlAnalysis.anomalyScore > 0.3) {
      suggestions.push('Conduct manual review to verify anomalous patterns');
    }

    if (features.weatherStationDistance > 50) {
      suggestions.push('Obtain weather data from closer monitoring stations');
    }

    return suggestions;
  }
}

export const mlConfidenceScorer = new MLConfidenceScorer(new PrismaClient());