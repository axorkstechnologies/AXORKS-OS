/**
 * Axorks OS — Knowledge Base & SOP Repository (Neon PostgreSQL)
 * Stores Standard Operating Procedures, process guidelines, templates, and documentation.
 */

import { sql } from "./db";

export interface KnowledgePageRecord {
  id: string;
  title: string;
  slug: string;
  category: string;
  page_type: "sop" | "page" | "template" | "meeting_notes" | "guide";
  icon: string;
  content: string;
  author_id?: string | null;
  author_name?: string | null;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

function mapDbRowToKnowledgePage(r: any): KnowledgePageRecord {
  return {
    id: String(r.id),
    title: r.title,
    slug: r.slug,
    category: r.category || "sop",
    page_type: r.page_type || "sop",
    icon: r.icon || "📄",
    content: r.content || "",
    author_id: r.author_id ? String(r.author_id) : null,
    author_name: r.author_name || "Founder",
    is_pinned: Boolean(r.is_pinned),
    created_at: new Date(r.created_at).toISOString(),
    updated_at: new Date(r.updated_at).toISOString(),
  };
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function getKnowledgePagesAsync(filters: {
  search?: string;
  category?: string;
} = {}): Promise<KnowledgePageRecord[]> {
  try {
    let rows: any[] = [];
    if (filters.search && filters.search.trim().length > 0) {
      const q = `%${filters.search.trim().toLowerCase()}%`;
      rows = await sql`
        SELECT * FROM knowledge_pages
        WHERE LOWER(title) LIKE ${q} OR LOWER(content) LIKE ${q} OR LOWER(category) LIKE ${q}
        ORDER BY is_pinned DESC, created_at DESC;
      `;
    } else if (filters.category && filters.category !== "all") {
      rows = await sql`
        SELECT * FROM knowledge_pages
        WHERE category = ${filters.category} OR page_type = ${filters.category}
        ORDER BY is_pinned DESC, created_at DESC;
      `;
    } else {
      rows = await sql`
        SELECT * FROM knowledge_pages
        ORDER BY is_pinned DESC, created_at DESC;
      `;
    }

    return rows.map(mapDbRowToKnowledgePage);
  } catch (err) {
    console.error("Error fetching knowledge pages from Neon DB:", err);
    return [];
  }
}

export async function getKnowledgePageBySlugAsync(slug: string): Promise<KnowledgePageRecord | null> {
  try {
    const rows = await sql`
      SELECT * FROM knowledge_pages
      WHERE slug = ${slug}
      LIMIT 1;
    `;
    if (rows.length === 0) return null;
    return mapDbRowToKnowledgePage(rows[0]);
  } catch (err) {
    console.error("Error fetching knowledge page by slug:", err);
    return null;
  }
}

export async function getKnowledgePageByIdAsync(id: string): Promise<KnowledgePageRecord | null> {
  try {
    const rows = await sql`
      SELECT * FROM knowledge_pages
      WHERE id::text = ${id}
      LIMIT 1;
    `;
    if (rows.length === 0) return null;
    return mapDbRowToKnowledgePage(rows[0]);
  } catch (err) {
    console.error("Error fetching knowledge page by id:", err);
    return null;
  }
}

export async function createKnowledgePageAsync(data: {
  title: string;
  slug?: string;
  category?: string;
  page_type?: "sop" | "page" | "template" | "meeting_notes" | "guide";
  icon?: string;
  content?: string;
  author_id?: string;
  author_name?: string;
  is_pinned?: boolean;
}): Promise<KnowledgePageRecord> {
  const title = data.title.trim();
  const rawSlug = data.slug || generateSlug(title) || `page-${Date.now()}`;
  let slug = rawSlug;

  // Check unique slug
  const existing = await sql`SELECT id FROM knowledge_pages WHERE slug = ${slug}`;
  if (existing.length > 0) {
    slug = `${rawSlug}-${Date.now().toString().slice(-4)}`;
  }

  const category = data.category || (data.page_type === "sop" ? "sop" : "general");
  const pageType = data.page_type || "sop";
  const icon = data.icon || (pageType === "sop" ? "📋" : "📄");
  const content = data.content || "";
  const authorId = data.author_id || null;
  const authorName = data.author_name || "Muhammad Mujahid (Founder)";
  const isPinned = data.is_pinned || false;

  const rows = await sql`
    INSERT INTO knowledge_pages (
      title, slug, category, page_type, icon, content, author_id, author_name, is_pinned, created_at, updated_at
    ) VALUES (
      ${title}, ${slug}, ${category}, ${pageType}, ${icon}, ${content}, ${authorId}, ${authorName}, ${isPinned}, NOW(), NOW()
    ) RETURNING *;
  `;

  return mapDbRowToKnowledgePage(rows[0]);
}

export async function updateKnowledgePageAsync(
  id: string,
  data: {
    title?: string;
    content?: string;
    category?: string;
    page_type?: string;
    icon?: string;
    is_pinned?: boolean;
  }
): Promise<KnowledgePageRecord | null> {
  const current = await getKnowledgePageByIdAsync(id);
  if (!current) return null;

  const title = data.title !== undefined ? data.title.trim() : current.title;
  const content = data.content !== undefined ? data.content : current.content;
  const category = data.category !== undefined ? data.category : current.category;
  const pageType = data.page_type !== undefined ? data.page_type : current.page_type;
  const icon = data.icon !== undefined ? data.icon : current.icon;
  const isPinned = data.is_pinned !== undefined ? data.is_pinned : current.is_pinned;

  const rows = await sql`
    UPDATE knowledge_pages
    SET title = ${title},
        content = ${content},
        category = ${category},
        page_type = ${pageType},
        icon = ${icon},
        is_pinned = ${isPinned},
        updated_at = NOW()
    WHERE id::text = ${id}
    RETURNING *;
  `;

  if (rows.length === 0) return null;
  return mapDbRowToKnowledgePage(rows[0]);
}

export async function deleteKnowledgePageAsync(id: string): Promise<boolean> {
  try {
    await sql`DELETE FROM knowledge_pages WHERE id::text = ${id}`;
    return true;
  } catch (err) {
    console.error("Error deleting knowledge page:", err);
    return false;
  }
}
