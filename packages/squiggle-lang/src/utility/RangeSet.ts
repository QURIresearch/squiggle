import { pairwise } from "./E_A.js";

export type Range = readonly [number, number];

export class RangeSet {
  public readonly ranges: Range[];

  constructor(ranges: readonly Range[]) {
    if (!this.isValid(ranges)) {
      throw new Error(
        "Invalid ranges: Ranges must be ordered and non-overlapping."
      );
    }

    this.ranges = [...ranges];
  }

  difference(other: RangeSet): RangeSet {
    const result: Range[] = [];
    const newRange1 = [...this.ranges] as [number, number][]; // Make a copy of this.ranges to avoid modifying the original array
    let i = 0;
    let j = 0;

    while (i < newRange1.length && j < other.ranges.length) {
      const [start1, end1] = newRange1[i];
      const [start2, end2] = other.ranges[j];

      if (start2 > end1) {
        // No overlap, add the entire range from newRange1
        result.push([start1, end1]);
        i++;
      } else if (end2 < start1) {
        // No overlap, move to the next range in other.ranges
        j++;
      } else {
        // Overlap found, split the range from newRange1
        if (start1 < start2) {
          result.push([start1, start2]);
        }
        if (end1 > end2) {
          newRange1[i][0] = end2; // Update the start of the current range in newRange1
          j++;
        } else {
          i++;
        }
      }
    }

    // Add any remaining ranges from newRange1
    while (i < newRange1.length) {
      result.push(newRange1[i]);
      i++;
    }

    return new RangeSet(result);
  }

  intersection(other: RangeSet): RangeSet {
    const result: Range[] = [];
    let i = 0;
    let j = 0;

    // O(n + m)
    while (i < this.ranges.length && j < other.ranges.length) {
      const [start1, end1] = this.ranges[i];
      const [start2, end2] = other.ranges[j];

      const start = Math.max(start1, start2);
      const end = Math.min(end1, end2);

      if (start <= end) {
        result.push([start, end]);
      }

      if (end1 < end2) {
        i++;
      } else {
        j++;
      }
    }

    return new RangeSet(result);
  }

  union(other: RangeSet): RangeSet {
    const result: Range[] = [];
    let i = 0;
    let j = 0;
    let currentStart = Infinity;
    let currentEnd = -Infinity;

    while (i < this.ranges.length || j < other.ranges.length) {
      const [start1, end1] = this.ranges[i] || [Infinity, -Infinity];
      const [start2, end2] = other.ranges[j] || [Infinity, -Infinity];

      const start = Math.min(start1, start2);
      const end = Math.max(end1, end2);

      if (start <= currentEnd) {
        currentEnd = Math.max(currentEnd, end);
      } else {
        if (currentStart !== Infinity) {
          result.push([currentStart, currentEnd]);
        }
        currentStart = start;
        currentEnd = end;
      }

      if (end1 < end2) {
        i++;
      } else if (end2 < end1) {
        j++;
      } else {
        i++;
        j++;
      }
    }

    if (currentStart !== Infinity) {
      result.push([currentStart, currentEnd]);
    }

    return new RangeSet(result);
  }

  isEmpty(): boolean {
    return this.ranges.length === 0;
  }

  isSubsetOf(other: RangeSet): boolean {
    return this.difference(other).isEmpty();
  }

  isSupersetOf(other: RangeSet): boolean {
    return other.isSubsetOf(this);
  }

  isEqual(other: RangeSet): boolean {
    if (this.ranges.length !== other.ranges.length) {
      return false;
    }

    return this.ranges.every((range, index) => {
      const [start1, end1] = range;
      const [start2, end2] = other.ranges[index];
      return start1 === start2 && end1 === end2;
    });
  }

  valid(): boolean {
    return this.isValid(this.ranges);
  }

  min(): number | undefined {
    return this.ranges.at(0)?.[0];
  }

  max(): number | undefined {
    return this.ranges.at(-1)?.[1];
  }

  private isValid(ranges: readonly Range[]): boolean {
    const isOrdered = (range1: Range, range2: Range): boolean => {
      const [, prevEnd] = range1;
      const [currStart] = range2;
      return currStart > prevEnd;
    };

    return pairwise(ranges, isOrdered).every(Boolean);
  }
}
