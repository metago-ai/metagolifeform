/**
 * MetaGO Engine - 运行时记忆
 * Runtime Memory
 *
 * 简化版：使用 JSON 文件存储引擎运行时状态。
 * 未来可升级为 SQLite 或独立服务。
 *
 * @author 易霄 / MetaGO Lightyear
 * @version 1.0.0
 */

import * as fs from 'fs';
import * as path from 'path';

export interface MemoryRecord {
  id: string;
  type: 'task' | 'decision' | 'evolution' | 'validation' | 'boundary';
  timestamp: string;
  data: any;
  tags?: string[];
}

export interface MemoryStats {
  totalRecords: number;
  byType: Record<string, number>;
  oldestRecord?: string;
  newestRecord?: string;
  storageSize: number;
}

/**
 * 运行时记忆
 * Runtime Memory - 使用 JSON 文件存储引擎状态
 */
export class RuntimeMemory {
  private filePath: string;
  private records: MemoryRecord[] = [];
  private maxRecords: number = 1000;

  constructor(filePath?: string) {
    this.filePath = filePath || path.join(process.cwd(), '.metago-memory.json');
    this.load();
  }

  /**
   * 加载记忆
   */
  private load(): void {
    if (fs.existsSync(this.filePath)) {
      try {
        const content = fs.readFileSync(this.filePath, 'utf-8');
        this.records = JSON.parse(content);
      } catch (e) {
        this.records = [];
      }
    }
  }

  /**
   * 保存记忆
   */
  private save(): void {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.records, null, 2), 'utf-8');
    } catch (e) {
      // 静默失败，不阻塞主流程
    }
  }

  /**
   * 记录一条
   */
  record(type: MemoryRecord['type'], data: any, tags?: string[]): string {
    const id = `MEM-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const record: MemoryRecord = {
      id,
      type,
      timestamp: new Date().toISOString(),
      data,
      tags,
    };
    this.records.push(record);

    // 限制记录数量
    if (this.records.length > this.maxRecords) {
      this.records = this.records.slice(-this.maxRecords);
    }

    this.save();
    return id;
  }

  /**
   * 查询记录
   */
  query(filter: {
    type?: MemoryRecord['type'];
    tags?: string[];
    startTime?: string;
    endTime?: string;
  }): MemoryRecord[] {
    return this.records.filter(r => {
      if (filter.type && r.type !== filter.type) return false;
      if (filter.tags && filter.tags.length > 0) {
        if (!r.tags || !filter.tags.some(t => r.tags!.includes(t))) return false;
      }
      if (filter.startTime && r.timestamp < filter.startTime) return false;
      if (filter.endTime && r.timestamp > filter.endTime) return false;
      return true;
    });
  }

  /**
   * 获取最新记录
   */
  getLatest(type?: MemoryRecord['type']): MemoryRecord | null {
    const filtered = type ? this.records.filter(r => r.type === type) : this.records;
    return filtered.length > 0 ? filtered[filtered.length - 1] : null;
  }

  /**
   * 获取统计
   */
  getStats(): MemoryStats {
    const byType: Record<string, number> = {};
    for (const r of this.records) {
      byType[r.type] = (byType[r.type] || 0) + 1;
    }

    let storageSize = 0;
    try {
      storageSize = fs.existsSync(this.filePath) ? fs.statSync(this.filePath).size : 0;
    } catch {}

    return {
      totalRecords: this.records.length,
      byType,
      oldestRecord: this.records[0]?.timestamp,
      newestRecord: this.records[this.records.length - 1]?.timestamp,
      storageSize,
    };
  }

  /**
   * 清空记忆
   */
  clear(): void {
    this.records = [];
    this.save();
  }

  /**
   * 清理过期记录
   */
  cleanup(maxAgeMs: number = 7 * 24 * 60 * 60 * 1000): number {
    const cutoff = new Date(Date.now() - maxAgeMs).toISOString();
    const before = this.records.length;
    this.records = this.records.filter(r => r.timestamp >= cutoff);
    const removed = before - this.records.length;
    if (removed > 0) this.save();
    return removed;
  }
}

export default RuntimeMemory;
