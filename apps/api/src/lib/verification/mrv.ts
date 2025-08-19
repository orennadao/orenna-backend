import { EvidenceFile, VerificationResult } from '@orenna/db';
import { FastifyBaseLogger } from 'fastify';

export interface MRVProtocol {
  name: string;
  version: string;
  measurementRequirements: MeasurementRequirement[];
  reportingRequirements: ReportingRequirement[];
  verificationRequirements: VerificationRequirement[];
}

export interface MeasurementRequirement {
  parameter: string;
  unit: string;
  frequency: string;
  accuracy: number;
  method: string;
  equipment?: string[];
  calibration?: CalibrationRequirement;
}

export interface ReportingRequirement {
  format: string;
  frequency: string;
  template?: string;
  requiredFields: string[];
  submissionDeadline: string;
}

export interface VerificationRequirement {
  verifierQualifications: string[];
  documentationRequired: string[];
  siteVisitRequired: boolean;
  samplingSize: number;
  confidenceLevel: number;
}

export interface CalibrationRequirement {
  frequency: string;
  standard: string;
  tolerance: number;
  recordKeeping: string;
}

export interface MRVAssessment {
  measurementCompliance: ComplianceResult;
  reportingCompliance: ComplianceResult;
  verificationCompliance: ComplianceResult;
  overallScore: number;
  recommendations: string[];
}

export interface ComplianceResult {
  compliant: boolean;
  score: number;
  issues: string[];
  evidence: string[];
}

/**
 * MRV (Measurement, Reporting, Verification) Protocol Manager
 * Implements standardized MRV frameworks for environmental credits
 */
export class MRVProtocolManager {
  private protocols: Map<string, MRVProtocol> = new Map();
  private logger: FastifyBaseLogger;

  constructor(logger: FastifyBaseLogger) {
    this.logger = logger;
    this.initializeStandardProtocols();
  }

  /**
   * Initialize standard MRV protocols
   */
  private initializeStandardProtocols() {
    // Water MRV Protocol
    this.registerProtocol({
      name: 'Water Conservation MRV',
      version: '1.0',
      measurementRequirements: [
        {
          parameter: 'water_volume',
          unit: 'liters',
          frequency: 'daily',
          accuracy: 0.95,
          method: 'flow_meter',
          equipment: ['calibrated_flow_meter', 'data_logger'],
          calibration: {
            frequency: 'monthly',
            standard: 'ISO_4064',
            tolerance: 0.02,
            recordKeeping: 'digital_log'
          }
        },
        {
          parameter: 'water_quality',
          unit: 'various',
          frequency: 'weekly',
          accuracy: 0.90,
          method: 'laboratory_analysis',
          equipment: ['sample_bottles', 'preservation_chemicals']
        },
        {
          parameter: 'precipitation',
          unit: 'mm',
          frequency: 'daily',
          accuracy: 0.95,
          method: 'rain_gauge',
          equipment: ['calibrated_rain_gauge']
        }
      ],
      reportingRequirements: [
        {
          format: 'structured_data',
          frequency: 'monthly',
          template: 'water_conservation_template_v1',
          requiredFields: [
            'measurement_period',
            'water_volume_baseline',
            'water_volume_project',
            'methodology_used',
            'equipment_calibration_status',
            'data_quality_assessment'
          ],
          submissionDeadline: '15_days_after_period'
        }
      ],
      verificationRequirements: [
        {
          verifierQualifications: [
            'certified_water_engineer',
            'environmental_auditor',
            'minimum_5_years_experience'
          ],
          documentationRequired: [
            'measurement_records',
            'equipment_calibration_certificates',
            'methodology_documentation',
            'site_photos',
            'quality_assurance_plan'
          ],
          siteVisitRequired: true,
          samplingSize: 0.1,
          confidenceLevel: 0.95
        }
      ]
    });

    // Carbon MRV Protocol
    this.registerProtocol({
      name: 'Carbon Sequestration MRV',
      version: '1.0',
      measurementRequirements: [
        {
          parameter: 'biomass_carbon',
          unit: 'tCO2e',
          frequency: 'annually',
          accuracy: 0.90,
          method: 'allometric_equations',
          equipment: ['dbh_tape', 'height_measurement_tool']
        },
        {
          parameter: 'soil_carbon',
          unit: 'tCO2e',
          frequency: 'every_3_years',
          accuracy: 0.85,
          method: 'soil_sampling',
          equipment: ['soil_auger', 'sample_containers']
        }
      ],
      reportingRequirements: [
        {
          format: 'standardized_form',
          frequency: 'annually',
          template: 'carbon_sequestration_template_v1',
          requiredFields: [
            'project_area',
            'tree_species',
            'carbon_stock_change',
            'uncertainty_assessment',
            'leakage_assessment'
          ],
          submissionDeadline: '90_days_after_period'
        }
      ],
      verificationRequirements: [
        {
          verifierQualifications: [
            'certified_carbon_auditor',
            'forestry_expert',
            'vcs_approved_verifier'
          ],
          documentationRequired: [
            'forest_inventory_data',
            'carbon_calculations',
            'monitoring_plan',
            'satellite_imagery',
            'field_verification_reports'
          ],
          siteVisitRequired: true,
          samplingSize: 0.05,
          confidenceLevel: 0.90
        }
      ]
    });
  }

  /**
   * Register a new MRV protocol
   */
  registerProtocol(protocol: MRVProtocol) {
    this.protocols.set(protocol.name, protocol);
    this.logger.info({ protocolName: protocol.name, version: protocol.version }, 'Registered MRV protocol');
  }

  /**
   * Get available MRV protocols
   */
  getProtocols(): MRVProtocol[] {
    return Array.from(this.protocols.values());
  }

  /**
   * Get specific MRV protocol
   */
  getProtocol(name: string): MRVProtocol | undefined {
    return this.protocols.get(name);
  }

  /**
   * Assess MRV compliance for a verification result
   */
  async assessMRVCompliance(
    protocolName: string,
    evidenceFiles: EvidenceFile[],
    verificationResult: VerificationResult
  ): Promise<MRVAssessment> {
    const protocol = this.protocols.get(protocolName);
    if (!protocol) {
      throw new Error(`MRV protocol ${protocolName} not found`);
    }

    this.logger.info({ 
      protocolName,
      verificationResultId: verificationResult.id 
    }, 'Assessing MRV compliance');

    // Assess measurement compliance
    const measurementCompliance = this.assessMeasurementCompliance(
      protocol.measurementRequirements,
      evidenceFiles
    );

    // Assess reporting compliance
    const reportingCompliance = this.assessReportingCompliance(
      protocol.reportingRequirements,
      evidenceFiles,
      verificationResult
    );

    // Assess verification compliance
    const verificationCompliance = this.assessVerificationCompliance(
      protocol.verificationRequirements,
      evidenceFiles,
      verificationResult
    );

    // Calculate overall score
    const overallScore = (
      measurementCompliance.score * 0.4 +
      reportingCompliance.score * 0.3 +
      verificationCompliance.score * 0.3
    );

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      measurementCompliance,
      reportingCompliance,
      verificationCompliance
    );

    return {
      measurementCompliance,
      reportingCompliance,
      verificationCompliance,
      overallScore,
      recommendations
    };
  }

  /**
   * Assess measurement compliance
   */
  private assessMeasurementCompliance(
    requirements: MeasurementRequirement[],
    evidenceFiles: EvidenceFile[]
  ): ComplianceResult {
    const issues: string[] = [];
    const evidence: string[] = [];
    let score = 0;

    for (const requirement of requirements) {
      const relevantEvidence = evidenceFiles.filter(f => 
        this.isRelevantToMeasurement(f, requirement)
      );

      if (relevantEvidence.length === 0) {
        issues.push(`Missing evidence for ${requirement.parameter} measurement`);
        continue;
      }

      // Check accuracy compliance
      const accuracyCompliant = this.checkAccuracyCompliance(relevantEvidence, requirement);
      if (!accuracyCompliant) {
        issues.push(`${requirement.parameter} measurements do not meet accuracy requirement (${requirement.accuracy})`);
      } else {
        score += 1;
        evidence.push(`${requirement.parameter} measurements verified`);
      }

      // Check frequency compliance
      const frequencyCompliant = this.checkFrequencyCompliance(relevantEvidence, requirement);
      if (!frequencyCompliant) {
        issues.push(`${requirement.parameter} measurement frequency does not meet requirement (${requirement.frequency})`);
      } else {
        score += 1;
        evidence.push(`${requirement.parameter} frequency verified`);
      }

      // Check calibration compliance if required
      if (requirement.calibration) {
        const calibrationCompliant = this.checkCalibrationCompliance(relevantEvidence, requirement.calibration);
        if (!calibrationCompliant) {
          issues.push(`${requirement.parameter} equipment calibration does not meet requirements`);
        } else {
          score += 1;
          evidence.push(`${requirement.parameter} calibration verified`);
        }
      }
    }

    const maxScore = requirements.reduce((sum, req) => 
      sum + 2 + (req.calibration ? 1 : 0), 0
    );

    return {
      compliant: issues.length === 0,
      score: maxScore > 0 ? score / maxScore : 0,
      issues,
      evidence
    };
  }

  /**
   * Assess reporting compliance
   */
  private assessReportingCompliance(
    requirements: ReportingRequirement[],
    evidenceFiles: EvidenceFile[],
    verificationResult: VerificationResult
  ): ComplianceResult {
    const issues: string[] = [];
    const evidence: string[] = [];
    let score = 0;

    for (const requirement of requirements) {
      // Check format compliance
      const formatCompliant = this.checkReportingFormat(evidenceFiles, requirement);
      if (!formatCompliant) {
        issues.push(`Reports do not meet format requirement: ${requirement.format}`);
      } else {
        score += 1;
        evidence.push(`Report format compliance verified`);
      }

      // Check required fields
      const fieldsCompliant = this.checkRequiredFields(evidenceFiles, requirement.requiredFields);
      if (!fieldsCompliant.compliant) {
        issues.push(`Missing required fields: ${fieldsCompliant.missing.join(', ')}`);
      } else {
        score += 1;
        evidence.push(`All required fields present`);
      }

      // Check submission timing
      const timingCompliant = this.checkSubmissionTiming(verificationResult, requirement);
      if (!timingCompliant) {
        issues.push(`Report submission does not meet deadline requirement: ${requirement.submissionDeadline}`);
      } else {
        score += 1;
        evidence.push(`Submission timing verified`);
      }
    }

    const maxScore = requirements.length * 3;

    return {
      compliant: issues.length === 0,
      score: maxScore > 0 ? score / maxScore : 0,
      issues,
      evidence
    };
  }

  /**
   * Assess verification compliance
   */
  private assessVerificationCompliance(
    requirements: VerificationRequirement[],
    evidenceFiles: EvidenceFile[],
    verificationResult: VerificationResult
  ): ComplianceResult {
    const issues: string[] = [];
    const evidence: string[] = [];
    let score = 0;

    for (const requirement of requirements) {
      // Check verifier qualifications
      const qualificationsCompliant = this.checkVerifierQualifications(
        verificationResult,
        requirement.verifierQualifications
      );
      if (!qualificationsCompliant) {
        issues.push(`Verifier qualifications do not meet requirements`);
      } else {
        score += 1;
        evidence.push(`Verifier qualifications verified`);
      }

      // Check required documentation
      const documentationCompliant = this.checkRequiredDocumentation(
        evidenceFiles,
        requirement.documentationRequired
      );
      if (!documentationCompliant.compliant) {
        issues.push(`Missing required documentation: ${documentationCompliant.missing.join(', ')}`);
      } else {
        score += 1;
        evidence.push(`Required documentation present`);
      }

      // Check site visit requirement
      if (requirement.siteVisitRequired) {
        const siteVisitCompliant = this.checkSiteVisitEvidence(evidenceFiles);
        if (!siteVisitCompliant) {
          issues.push(`Site visit evidence not found`);
        } else {
          score += 1;
          evidence.push(`Site visit evidence verified`);
        }
      }

      // Check confidence level
      const confidenceCompliant = this.checkConfidenceLevel(
        verificationResult,
        requirement.confidenceLevel
      );
      if (!confidenceCompliant) {
        issues.push(`Verification confidence level below requirement (${requirement.confidenceLevel})`);
      } else {
        score += 1;
        evidence.push(`Confidence level meets requirements`);
      }
    }

    const maxScore = requirements.reduce((sum, req) => 
      sum + 3 + (req.siteVisitRequired ? 1 : 0), 0
    );

    return {
      compliant: issues.length === 0,
      score: maxScore > 0 ? score / maxScore : 0,
      issues,
      evidence
    };
  }

  /**
   * Generate recommendations based on compliance assessment
   */
  private generateRecommendations(
    measurementCompliance: ComplianceResult,
    reportingCompliance: ComplianceResult,
    verificationCompliance: ComplianceResult
  ): string[] {
    const recommendations: string[] = [];

    if (measurementCompliance.score < 0.8) {
      recommendations.push('Improve measurement protocols and equipment calibration');
      recommendations.push('Increase measurement frequency to meet protocol requirements');
    }

    if (reportingCompliance.score < 0.8) {
      recommendations.push('Ensure all required fields are included in reports');
      recommendations.push('Submit reports within specified deadlines');
    }

    if (verificationCompliance.score < 0.8) {
      recommendations.push('Engage qualified verifiers with appropriate certifications');
      recommendations.push('Ensure comprehensive documentation is provided');
    }

    if (recommendations.length === 0) {
      recommendations.push('MRV compliance is excellent - maintain current standards');
    }

    return recommendations;
  }

  // Helper methods for compliance checking
  private isRelevantToMeasurement(evidence: EvidenceFile, requirement: MeasurementRequirement): boolean {
    const evidenceType = evidence.evidenceType.toLowerCase();
    const parameter = requirement.parameter.toLowerCase();
    return evidenceType.includes(parameter) || 
           evidenceType.includes('measurement') ||
           evidenceType.includes('sensor_data');
  }

  private checkAccuracyCompliance(evidence: EvidenceFile[], requirement: MeasurementRequirement): boolean {
    // In real implementation, would parse evidence files to check actual accuracy
    // For now, assume compliance if evidence exists and has accuracy metadata
    return evidence.some(e => 
      e.metadata && 
      typeof e.metadata === 'object' && 
      'accuracy' in e.metadata
    );
  }

  private checkFrequencyCompliance(evidence: EvidenceFile[], requirement: MeasurementRequirement): boolean {
    // Check if evidence spans appropriate time period for frequency requirement
    return evidence.length > 0; // Simplified check
  }

  private checkCalibrationCompliance(evidence: EvidenceFile[], calibration: CalibrationRequirement): boolean {
    return evidence.some(e => e.evidenceType.includes('CALIBRATION'));
  }

  private checkReportingFormat(evidence: EvidenceFile[], requirement: ReportingRequirement): boolean {
    const reportEvidence = evidence.filter(e => 
      e.evidenceType.includes('REPORT') || 
      e.evidenceType.includes('DOCUMENTATION')
    );
    return reportEvidence.length > 0;
  }

  private checkRequiredFields(evidence: EvidenceFile[], requiredFields: string[]): {
    compliant: boolean;
    missing: string[];
  } {
    // Simplified check - in real implementation would parse report contents
    const missing = requiredFields.filter(field => 
      !evidence.some(e => 
        e.metadata && 
        typeof e.metadata === 'object' && 
        field in e.metadata
      )
    );
    
    return {
      compliant: missing.length === 0,
      missing
    };
  }

  private checkSubmissionTiming(verificationResult: VerificationResult, requirement: ReportingRequirement): boolean {
    // Simplified check - in real implementation would parse deadline requirements
    return true;
  }

  private checkVerifierQualifications(
    verificationResult: VerificationResult,
    qualifications: string[]
  ): boolean {
    // Check if verifier metadata includes required qualifications
    return verificationResult.metadata && 
           typeof verificationResult.metadata === 'object' &&
           'verifierQualifications' in verificationResult.metadata;
  }

  private checkRequiredDocumentation(
    evidence: EvidenceFile[],
    requiredDocs: string[]
  ): { compliant: boolean; missing: string[] } {
    const providedTypes = evidence.map(e => e.evidenceType.toLowerCase());
    const missing = requiredDocs.filter(doc => 
      !providedTypes.some(type => type.includes(doc.toLowerCase().replace('_', '')))
    );
    
    return {
      compliant: missing.length === 0,
      missing
    };
  }

  private checkSiteVisitEvidence(evidence: EvidenceFile[]): boolean {
    return evidence.some(e => 
      e.evidenceType.includes('SITE_VISIT') || 
      e.evidenceType.includes('FIELD_VERIFICATION')
    );
  }

  private checkConfidenceLevel(
    verificationResult: VerificationResult,
    requiredConfidence: number
  ): boolean {
    return verificationResult.confidenceScore !== null && 
           verificationResult.confidenceScore >= requiredConfidence;
  }
}