import { FastifyBaseLogger } from 'fastify';
import csv from 'csv-parser';
import { Readable } from 'stream';
import * as xlsx from 'xlsx';

export interface ParsedData {
  format: 'json' | 'csv' | 'excel' | 'text' | 'unknown';
  data: any;
  rowCount?: number;
  columns?: string[];
  metadata?: Record<string, any>;
}

export interface ParseOptions {
  maxRows?: number;
  encoding?: BufferEncoding;
  csvOptions?: {
    separator?: string;
    headers?: boolean;
    skipEmptyLines?: boolean;
  };
  excelOptions?: {
    sheetIndex?: number;
    sheetName?: string;
    range?: string;
  };
}

/**
 * File Parser Service
 * Parses various file formats for evidence validation
 */
export class FileParser {
  private logger: FastifyBaseLogger;

  constructor(logger: FastifyBaseLogger) {
    this.logger = logger;
  }

  /**
   * Parse file content based on MIME type and file extension
   */
  async parseFile(
    content: Buffer,
    fileName: string,
    mimeType: string,
    options: ParseOptions = {}
  ): Promise<ParsedData> {
    this.logger.info({ 
      fileName, 
      mimeType, 
      size: content.length 
    }, 'Parsing file content');

    try {
      const format = this.detectFormat(fileName, mimeType);
      
      switch (format) {
        case 'json':
          return await this.parseJSON(content, options);
        case 'csv':
          return await this.parseCSV(content, options);
        case 'excel':
          return await this.parseExcel(content, fileName, options);
        case 'text':
          return await this.parseText(content, options);
        default:
          return {
            format: 'unknown',
            data: null,
            metadata: {
              originalSize: content.length,
              mimeType
            }
          };
      }
    } catch (error) {
      this.logger.error({
        fileName,
        mimeType,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 'Failed to parse file');
      
      throw new Error(`File parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Detect file format based on extension and MIME type
   */
  private detectFormat(fileName: string, mimeType: string): 'json' | 'csv' | 'excel' | 'text' | 'unknown' {
    const extension = fileName.toLowerCase().split('.').pop() || '';
    
    // Check by MIME type first
    if (mimeType.includes('json')) return 'json';
    if (mimeType.includes('csv')) return 'csv';
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'excel';
    if (mimeType.includes('text')) return 'text';
    
    // Check by file extension
    switch (extension) {
      case 'json':
        return 'json';
      case 'csv':
        return 'csv';
      case 'xlsx':
      case 'xls':
      case 'xlsm':
        return 'excel';
      case 'txt':
      case 'log':
        return 'text';
      default:
        return 'unknown';
    }
  }

  /**
   * Parse JSON file
   */
  private async parseJSON(content: Buffer, options: ParseOptions): Promise<ParsedData> {
    const text = content.toString(options.encoding || 'utf8');
    const data = JSON.parse(text);
    
    let rowCount: number | undefined;
    let columns: string[] | undefined;
    
    if (Array.isArray(data)) {
      rowCount = data.length;
      if (data.length > 0 && typeof data[0] === 'object' && data[0] !== null) {
        columns = Object.keys(data[0]);
      }
    }
    
    return {
      format: 'json',
      data: options.maxRows && Array.isArray(data) ? data.slice(0, options.maxRows) : data,
      rowCount,
      columns,
      metadata: {
        originalSize: content.length,
        encoding: options.encoding || 'utf8'
      }
    };
  }

  /**
   * Parse CSV file
   */
  private async parseCSV(content: Buffer, options: ParseOptions): Promise<ParsedData> {
    return new Promise((resolve, reject) => {
      const results: any[] = [];
      let columns: string[] = [];
      let isFirstRow = true;
      
      const csvOptions = {
        separator: options.csvOptions?.separator || ',',
        headers: options.csvOptions?.headers !== false,
        skipEmptyLines: options.csvOptions?.skipEmptyLines !== false,
        ...(options.maxRows && { maxRows: options.maxRows })
      };

      const readable = Readable.from(content.toString(options.encoding || 'utf8'));
      
      readable
        .pipe(csv(csvOptions))
        .on('headers', (headerList: string[]) => {
          columns = headerList;
        })
        .on('data', (data: any) => {
          if (options.maxRows && results.length >= options.maxRows) {
            return;
          }
          
          results.push(data);
          
          // Extract column names from first data row if no headers
          if (isFirstRow && columns.length === 0) {
            columns = Object.keys(data);
            isFirstRow = false;
          }
        })
        .on('end', () => {
          resolve({
            format: 'csv',
            data: results,
            rowCount: results.length,
            columns,
            metadata: {
              originalSize: content.length,
              separator: csvOptions.separator,
              hasHeaders: csvOptions.headers,
              encoding: options.encoding || 'utf8'
            }
          });
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }

  /**
   * Parse Excel file
   */
  private async parseExcel(content: Buffer, fileName: string, options: ParseOptions): Promise<ParsedData> {
    const workbook = xlsx.read(content, { 
      type: 'buffer',
      cellDates: true,
      cellNF: false,
      cellText: false
    });
    
    // Get sheet to read
    const sheetNames = workbook.SheetNames;
    let sheetName: string;
    
    if (options.excelOptions?.sheetName) {
      sheetName = options.excelOptions.sheetName;
    } else if (options.excelOptions?.sheetIndex !== undefined) {
      sheetName = sheetNames[options.excelOptions.sheetIndex] || sheetNames[0] || '';
    } else {
      sheetName = sheetNames[0] || ''; // Default to first sheet
    }
    
    if (!sheetName || !workbook.Sheets[sheetName]) {
      throw new Error(`Sheet not found: ${sheetName || 'undefined'}`);
    }
    
    const worksheet = workbook.Sheets[sheetName];
    
    if (!worksheet) {
      throw new Error(`Worksheet not found: ${sheetName}`);
    }
    
    // Convert to JSON
    const jsonData = xlsx.utils.sheet_to_json(worksheet, {
      header: 1, // Use array of arrays format initially
      range: options.excelOptions?.range,
      raw: false,
      dateNF: 'yyyy-mm-dd'
    }) as any[][];
    
    if (jsonData.length === 0) {
      return {
        format: 'excel',
        data: [],
        rowCount: 0,
        columns: [],
        metadata: {
          originalSize: content.length,
          sheetName,
          availableSheets: sheetNames
        }
      };
    }
    
    // Extract headers and data
    const headers = jsonData[0] as string[];
    const dataRows = jsonData.slice(1);
    
    // Convert to objects if headers exist
    let processedData: any[];
    if (headers && headers.length > 0 && headers[0] !== undefined) {
      processedData = dataRows.map(row => {
        const obj: any = {};
        headers.forEach((header, index) => {
          obj[header] = row[index];
        });
        return obj;
      });
    } else {
      processedData = dataRows;
    }
    
    // Apply row limit
    const finalData = options.maxRows ? processedData.slice(0, options.maxRows) : processedData;
    
    return {
      format: 'excel',
      data: finalData,
      rowCount: dataRows.length,
      columns: headers.filter(h => h !== undefined),
      metadata: {
        originalSize: content.length,
        sheetName,
        availableSheets: sheetNames,
        totalSheets: sheetNames.length,
        range: options.excelOptions?.range
      }
    };
  }

  /**
   * Parse plain text file
   */
  private async parseText(content: Buffer, options: ParseOptions): Promise<ParsedData> {
    const text = content.toString(options.encoding || 'utf8');
    const lines = text.split('\n');
    
    const processedLines = options.maxRows ? lines.slice(0, options.maxRows) : lines;
    
    return {
      format: 'text',
      data: {
        fullText: text,
        lines: processedLines
      },
      rowCount: lines.length,
      metadata: {
        originalSize: content.length,
        lineCount: lines.length,
        encoding: options.encoding || 'utf8',
        truncated: options.maxRows ? lines.length > options.maxRows : false
      }
    };
  }

  /**
   * Extract metadata from parsed data for VWBA calculations
   */
  extractVWBAMetadata(parsedData: ParsedData): Record<string, any> {
    const metadata: Record<string, any> = {};
    
    try {
      if (parsedData.format === 'json' || parsedData.format === 'csv' || parsedData.format === 'excel') {
        const data = Array.isArray(parsedData.data) ? parsedData.data : [parsedData.data];
        
        // Look for VWBA-specific fields
        const vwbaFields = [
          'waterVolume', 'water_volume', 'volume',
          'baselineVolume', 'baseline_volume', 'baseline',
          'projectVolume', 'project_volume', 'project',
          'measurementPeriod', 'measurement_period', 'period',
          'latitude', 'longitude', 'coordinates',
          'accuracy', 'uncertainty', 'error',
          'date', 'timestamp', 'measurement_date'
        ];
        
        // Extract relevant fields from data
        if (data.length > 0 && typeof data[0] === 'object') {
          const firstRow = data[0];
          
          for (const field of vwbaFields) {
            if (field in firstRow) {
              metadata[field] = firstRow[field];
            }
          }
          
          // Calculate aggregates if multiple rows
          if (data.length > 1) {
            const numericFields = ['waterVolume', 'water_volume', 'volume', 'baselineVolume', 'baseline_volume'];
            
            for (const field of numericFields) {
              if (field in firstRow) {
                const values = data
                  .map(row => parseFloat(row[field]))
                  .filter(val => !isNaN(val));
                
                if (values.length > 0) {
                  metadata[`${field}_sum`] = values.reduce((sum, val) => sum + val, 0);
                  metadata[`${field}_avg`] = values.reduce((sum, val) => sum + val, 0) / values.length;
                  metadata[`${field}_min`] = Math.min(...values);
                  metadata[`${field}_max`] = Math.max(...values);
                  metadata[`${field}_count`] = values.length;
                }
              }
            }
          }
        }
        
        // Add data structure metadata
        metadata.dataRowCount = data.length;
        metadata.dataColumns = parsedData.columns || [];
        metadata.dataFormat = parsedData.format;
      }
      
      return metadata;
      
    } catch (error) {
      this.logger.warn({
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 'Failed to extract VWBA metadata');
      
      return metadata;
    }
  }
}

/**
 * Create file parser instance
 */
export function createFileParser(logger: FastifyBaseLogger): FileParser {
  return new FileParser(logger);
}