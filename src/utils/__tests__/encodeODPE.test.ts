import { convertCodesToBiomarkers, extractBiomarkerCodes, extractCodes } from '../encodeODPE';
import { CancerType } from '../fhirConversionUtils';

describe('extractCodes()', () => {
  it('handles an empty array', () => {
    expect(extractCodes([])).toEqual([]);
  });
  it('extracts the codes with qualifiers', () => {
    expect(
      extractCodes([
        {
          entryType: 'metastasis',
          cancerType: ['brain', 'breast', 'colon', 'lung', 'multipleMyeloma', 'prostate'] as CancerType[],
          code: '94381002',
          display: 'Secondary malignant neoplasm of liver',
          system: 'http://snomed.info/sct',
          category: ['liver'],
        },
      ])
    ).toEqual(['94381002']);
  });
});

describe('extractBiomakerCodes()', () => {
  it('handles an empty array', () => {
    expect(extractBiomarkerCodes([])).toEqual([]);
  });
  it('extracts the codes with qualifiers', () => {
    expect(
      extractBiomarkerCodes([
        {
          entryType: 'biomarkers',
          cancerType: ['colon'] as CancerType[],
          code: '31150-6',
          display: 'ERBB2 gene duplication [Presence] in Tissue by FISH',
          system: 'http://loinc.org',
          category: ['ERBB2_HER2', 'HER2'],
          qualifier: {
            code: '260385009',
            display: 'Negative (qualifier value)',
            system: 'http://snomed.info/sct',
          },
        },
      ])
    ).toEqual(['260385009:31150-6']);
  });
});

describe('convertCodesToBiomarkers()', () => {
  it('recreates the qualifier', () => {
    const biomarkers = convertCodesToBiomarkers(['260385009:31150-6']);
    expect(biomarkers).toHaveLength(1);
    expect(biomarkers).toHaveProperty('0.entryType', 'biomarkers');
    expect(biomarkers).toHaveProperty('0.code', '31150-6');
    expect(biomarkers).toHaveProperty('0.display', 'ERBB2 gene duplication [Presence] in Tissue by FISH');
    expect(biomarkers).toHaveProperty('0.system', 'http://loinc.org');
    expect(biomarkers).toHaveProperty('0.category', ['ERBB2_HER2', 'HER2']);
    expect(biomarkers).toHaveProperty('0.qualifier.code', '260385009');
    expect(biomarkers).toHaveProperty('0.qualifier.display', 'Negative (qualifier value)');
    expect(biomarkers).toHaveProperty('0.qualifier.system', 'http://snomed.info/sct');
  });
});
