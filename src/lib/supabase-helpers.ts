import { supabase } from "@/lib/supabase";

/**
 * Fetches all rows from a Supabase table by automatically paginating in batches of 1000.
 * This bypasses Supabase / PostgREST's default max limit of 1000 rows per request.
 */
export async function fetchAllRows<T = any>(
  table: string,
  columns: string = "*",
  orderColumn: string = "created_at",
  ascending: boolean = false
): Promise<T[]> {
  const PAGE_SIZE = 1000;
  let allData: T[] = [];
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .order(orderColumn, { ascending })
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      console.error(`Error fetching all rows from ${table}:`, error);
      throw error;
    }

    if (data && data.length > 0) {
      allData = allData.concat(data as T[]);
      if (data.length < PAGE_SIZE) {
        hasMore = false;
      } else {
        from += PAGE_SIZE;
      }
    } else {
      hasMore = false;
    }
  }

  return allData;
}
