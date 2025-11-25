/**
 * Export Service - Multi-Format Export for Novels
 *
 * Exports completed novels to multiple formats:
 * - TXT: Plain text with proper formatting
 * - PDF: Professional layout using jsPDF
 * - EPUB: E-book format using epub-gen
 *
 * Features:
 * - Chapter formatting and structure
 * - Title pages and metadata
 * - Word count and statistics
 * - Professional layout and typography
 */

import jsPDF from 'jspdf';
import * as fs from 'fs';
import * as path from 'path';

// Note: epub-gen has TypeScript issues, using require
// eslint-disable-next-line @typescript-eslint/no-var-requires
const EPub = require('epub-gen');

export interface ExportMetadata {
  title: string;
  author: string;
  genre: string;
  description?: string;
  language?: string;
  publisher?: string;
  publishDate?: Date;
  isbn?: string;
  coverImage?: string;
}

export interface Chapter {
  number: number;
  title: string;
  content: string;
  wordCount: number;
}

export interface NovelData {
  metadata: ExportMetadata;
  chapters: Chapter[];
  totalWordCount: number;
  completionDate?: Date;
}

export interface ExportOptions {
  format: 'txt' | 'pdf' | 'epub';
  outputPath: string;
  includeMetadata?: boolean;
  includeWordCount?: boolean;
  pageSize?: 'a4' | 'letter';
  fontSize?: number;
  lineSpacing?: number;
}

export interface ExportResult {
  success: boolean;
  format: string;
  filePath: string;
  fileSize: number;
  error?: string;
}

export class ExportService {
  /**
   * Export novel to specified format
   */
  static async export(novel: NovelData, options: ExportOptions): Promise<ExportResult> {
    try {
      switch (options.format) {
        case 'txt':
          return await this.exportTXT(novel, options);
        case 'pdf':
          return await this.exportPDF(novel, options);
        case 'epub':
          return await this.exportEPUB(novel, options);
        default:
          throw new Error(`Unsupported format: ${options.format}`);
      }
    } catch (error) {
      return {
        success: false,
        format: options.format,
        filePath: options.outputPath,
        fileSize: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Export to plain text format
   */
  private static async exportTXT(novel: NovelData, options: ExportOptions): Promise<ExportResult> {
    const lines: string[] = [];

    // Title page
    if (options.includeMetadata !== false) {
      lines.push('='.repeat(80));
      lines.push(novel.metadata.title.toUpperCase());
      lines.push('');
      lines.push(`by ${novel.metadata.author}`);
      lines.push('');
      if (novel.metadata.genre) {
        lines.push(`Genre: ${novel.metadata.genre}`);
      }
      if (novel.metadata.description) {
        lines.push('');
        lines.push(novel.metadata.description);
      }
      lines.push('='.repeat(80));
      lines.push('');
      lines.push('');
    }

    // Chapters
    for (const chapter of novel.chapters) {
      lines.push('');
      lines.push(`CHAPTER ${chapter.number}`);
      if (chapter.title) {
        lines.push(chapter.title);
      }
      lines.push('');
      lines.push('-'.repeat(80));
      lines.push('');

      // Add chapter content with proper paragraph spacing
      const paragraphs = chapter.content.split('\n\n');
      for (const paragraph of paragraphs) {
        lines.push(paragraph.trim());
        lines.push('');
      }

      lines.push('');
    }

    // Footer
    if (options.includeWordCount !== false) {
      lines.push('');
      lines.push('='.repeat(80));
      lines.push(`Total Word Count: ${novel.totalWordCount.toLocaleString()}`);
      lines.push(`Chapters: ${novel.chapters.length}`);
      if (novel.completionDate) {
        lines.push(`Completed: ${novel.completionDate.toLocaleDateString()}`);
      }
      lines.push('='.repeat(80));
    }

    // Write to file
    const content = lines.join('\n');
    fs.writeFileSync(options.outputPath, content, 'utf-8');

    const stats = fs.statSync(options.outputPath);

    return {
      success: true,
      format: 'txt',
      filePath: options.outputPath,
      fileSize: stats.size,
    };
  }

  /**
   * Export to PDF format using jsPDF
   */
  private static async exportPDF(novel: NovelData, options: ExportOptions): Promise<ExportResult> {
    const pageSize = options.pageSize || 'letter';
    const fontSize = options.fontSize || 11;
    const lineSpacing = options.lineSpacing || 1.5;

    // Initialize PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: pageSize,
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 72; // 1 inch margins
    const maxWidth = pageWidth - (margin * 2);
    const lineHeight = fontSize * lineSpacing;

    let y = margin;

    // Helper to add new page
    const addPage = () => {
      pdf.addPage();
      y = margin;
    };

    // Helper to check if we need new page
    const checkPageBreak = (neededSpace: number) => {
      if (y + neededSpace > pageHeight - margin) {
        addPage();
        return true;
      }
      return false;
    };

    // Helper to add text with word wrap
    const addText = (text: string, size: number, align: 'left' | 'center' = 'left', bold = false) => {
      pdf.setFontSize(size);
      pdf.setFont('helvetica', bold ? 'bold' : 'normal');

      const lines = pdf.splitTextToSize(text, maxWidth);

      for (const line of lines) {
        checkPageBreak(size * lineSpacing);

        if (align === 'center') {
          const textWidth = pdf.getTextWidth(line);
          pdf.text(line, (pageWidth - textWidth) / 2, y);
        } else {
          pdf.text(line, margin, y);
        }

        y += size * lineSpacing;
      }
    };

    // Title page
    if (options.includeMetadata !== false) {
      y = pageHeight / 3;

      addText(novel.metadata.title, 24, 'center', true);
      y += 20;
      addText(`by ${novel.metadata.author}`, 14, 'center');
      y += 40;

      if (novel.metadata.genre) {
        addText(novel.metadata.genre, 12, 'center');
        y += 20;
      }

      if (novel.metadata.description) {
        y += 40;
        pdf.setFontSize(11);
        const descLines = pdf.splitTextToSize(novel.metadata.description, maxWidth - 100);
        for (const line of descLines) {
          checkPageBreak(11 * lineSpacing);
          pdf.text(line, pageWidth / 2, y, { align: 'center' });
          y += 11 * lineSpacing;
        }
      }

      addPage();
    }

    // Table of contents
    if (novel.chapters.length > 1) {
      addText('TABLE OF CONTENTS', 16, 'center', true);
      y += 20;

      for (const chapter of novel.chapters) {
        const chapterLine = `Chapter ${chapter.number}: ${chapter.title || 'Untitled'}`;
        addText(chapterLine, 11);
      }

      addPage();
    }

    // Chapters
    for (const chapter of novel.chapters) {
      // Chapter header
      addText(`CHAPTER ${chapter.number}`, 16, 'center', true);
      if (chapter.title) {
        y += 10;
        addText(chapter.title, 14, 'center', true);
      }
      y += 30;

      // Chapter content
      const paragraphs = chapter.content.split('\n\n');
      for (let i = 0; i < paragraphs.length; i++) {
        const paragraph = paragraphs[i].trim();
        if (!paragraph) continue;

        // Check for dialogue (starts with quote)
        const isDialogue = paragraph.startsWith('"');

        addText(paragraph, fontSize, 'left');

        // Add extra space between paragraphs (except last one)
        if (i < paragraphs.length - 1) {
          y += lineHeight * 0.5;
        }
      }

      // Start next chapter on new page (except last chapter)
      if (chapter.number < novel.chapters.length) {
        addPage();
      }
    }

    // Final page with statistics
    if (options.includeWordCount !== false) {
      addPage();
      y = pageHeight / 2;

      addText('STATISTICS', 16, 'center', true);
      y += 20;
      addText(`Total Word Count: ${novel.totalWordCount.toLocaleString()}`, 11, 'center');
      addText(`Total Chapters: ${novel.chapters.length}`, 11, 'center');

      if (novel.completionDate) {
        addText(`Completed: ${novel.completionDate.toLocaleDateString()}`, 11, 'center');
      }
    }

    // Save PDF
    pdf.save(options.outputPath);

    const stats = fs.statSync(options.outputPath);

    return {
      success: true,
      format: 'pdf',
      filePath: options.outputPath,
      fileSize: stats.size,
    };
  }

  /**
   * Export to EPUB format using epub-gen
   */
  private static async exportEPUB(novel: NovelData, options: ExportOptions): Promise<ExportResult> {
    // Prepare chapter content for EPUB
    const chapters = novel.chapters.map(chapter => ({
      title: `Chapter ${chapter.number}${chapter.title ? ': ' + chapter.title : ''}`,
      data: this.formatChapterForEPUB(chapter.content),
    }));

    // EPUB options
    const epubOptions = {
      title: novel.metadata.title,
      author: novel.metadata.author,
      publisher: novel.metadata.publisher || 'StoryForge',
      description: novel.metadata.description || '',
      language: novel.metadata.language || 'en',
      cover: novel.metadata.coverImage,
      tocTitle: 'Table of Contents',
      appendChapterTitles: true,
      content: chapters,
      verbose: false,
    };

    // Generate EPUB
    await new EPub(epubOptions, options.outputPath).promise;

    const stats = fs.statSync(options.outputPath);

    return {
      success: true,
      format: 'epub',
      filePath: options.outputPath,
      fileSize: stats.size,
    };
  }

  /**
   * Format chapter content for EPUB (HTML)
   */
  private static formatChapterForEPUB(content: string): string {
    const paragraphs = content.split('\n\n');
    const htmlParagraphs = paragraphs
      .filter(p => p.trim())
      .map(p => {
        // Check if paragraph is dialogue
        const trimmed = p.trim();
        if (trimmed.startsWith('"')) {
          return `<p class="dialogue">${this.escapeHTML(trimmed)}</p>`;
        }
        return `<p>${this.escapeHTML(trimmed)}</p>`;
      });

    return htmlParagraphs.join('\n');
  }

  /**
   * Escape HTML special characters
   */
  private static escapeHTML(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Export to all formats
   */
  static async exportAll(
    novel: NovelData,
    outputDir: string
  ): Promise<{
    txt: ExportResult;
    pdf: ExportResult;
    epub: ExportResult;
  }> {
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const baseFilename = this.sanitizeFilename(novel.metadata.title);

    // Export to all formats
    const [txt, pdf, epub] = await Promise.all([
      this.export(novel, {
        format: 'txt',
        outputPath: path.join(outputDir, `${baseFilename}.txt`),
      }),
      this.export(novel, {
        format: 'pdf',
        outputPath: path.join(outputDir, `${baseFilename}.pdf`),
      }),
      this.export(novel, {
        format: 'epub',
        outputPath: path.join(outputDir, `${baseFilename}.epub`),
      }),
    ]);

    return { txt, pdf, epub };
  }

  /**
   * Sanitize filename (remove invalid characters)
   */
  private static sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-z0-9_\-]/gi, '_')
      .replace(/_+/g, '_')
      .toLowerCase();
  }

  /**
   * Calculate word count for text
   */
  static calculateWordCount(text: string): number {
    return text
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 0)
      .length;
  }

  /**
   * Prepare novel data from chapters
   */
  static prepareNovelData(
    chapters: Array<{ title: string; content: string }>,
    metadata: ExportMetadata
  ): NovelData {
    const processedChapters: Chapter[] = chapters.map((ch, idx) => ({
      number: idx + 1,
      title: ch.title,
      content: ch.content,
      wordCount: this.calculateWordCount(ch.content),
    }));

    const totalWordCount = processedChapters.reduce((sum, ch) => sum + ch.wordCount, 0);

    return {
      metadata,
      chapters: processedChapters,
      totalWordCount,
      completionDate: new Date(),
    };
  }

  /**
   * Get export statistics
   */
  static getStatistics(novel: NovelData): {
    totalWords: number;
    totalChapters: number;
    averageWordsPerChapter: number;
    shortestChapter: number;
    longestChapter: number;
    estimatedPages: number;
    estimatedReadingTime: number; // minutes
  } {
    const wordCounts = novel.chapters.map(ch => ch.wordCount);

    return {
      totalWords: novel.totalWordCount,
      totalChapters: novel.chapters.length,
      averageWordsPerChapter: Math.round(novel.totalWordCount / novel.chapters.length),
      shortestChapter: Math.min(...wordCounts),
      longestChapter: Math.max(...wordCounts),
      estimatedPages: Math.round(novel.totalWordCount / 250), // ~250 words per page
      estimatedReadingTime: Math.round(novel.totalWordCount / 250), // ~250 words per minute
    };
  }

  /**
   * Validate novel data before export
   */
  static validateNovelData(novel: NovelData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!novel.metadata.title || novel.metadata.title.trim() === '') {
      errors.push('Title is required');
    }

    if (!novel.metadata.author || novel.metadata.author.trim() === '') {
      errors.push('Author is required');
    }

    if (!novel.chapters || novel.chapters.length === 0) {
      errors.push('At least one chapter is required');
    }

    for (const chapter of novel.chapters) {
      if (!chapter.content || chapter.content.trim() === '') {
        errors.push(`Chapter ${chapter.number} is empty`);
      }
    }

    if (novel.totalWordCount < 1000) {
      errors.push('Novel is too short (minimum 1,000 words)');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Create sample preview (first chapter or first N words)
   */
  static createPreview(novel: NovelData, maxWords = 1000): string {
    const preview: string[] = [];

    preview.push(novel.metadata.title);
    preview.push(`by ${novel.metadata.author}`);
    preview.push('');
    preview.push('---');
    preview.push('');

    if (novel.metadata.description) {
      preview.push(novel.metadata.description);
      preview.push('');
      preview.push('---');
      preview.push('');
    }

    // Add first chapter or up to maxWords
    let wordCount = 0;
    for (const chapter of novel.chapters) {
      if (wordCount >= maxWords) break;

      preview.push(`CHAPTER ${chapter.number}`);
      if (chapter.title) {
        preview.push(chapter.title);
      }
      preview.push('');

      const words = chapter.content.split(/\s+/);
      const remainingWords = maxWords - wordCount;

      if (words.length <= remainingWords) {
        preview.push(chapter.content);
        wordCount += words.length;
      } else {
        preview.push(words.slice(0, remainingWords).join(' ') + '...');
        wordCount = maxWords;
        break;
      }

      preview.push('');
    }

    preview.push('');
    preview.push(`[Preview: ${wordCount} of ${novel.totalWordCount} words]`);

    return preview.join('\n');
  }
}
