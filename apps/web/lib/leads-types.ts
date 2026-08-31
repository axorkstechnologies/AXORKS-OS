/**
 * Axorks OS — Lead Research Types (Client & Server Safe)
 */

export interface LeadToResearch {
  id?: string;
  lead_id?: string;
  business_name: string;
  website?: string;
  industry?: string;
  location?: string;
  country?: string;
  decision_maker_name?: string;
  decision_maker_title?: string;
  email?: string;
  phone?: string;
  source?: string;
  notes?: string;
}

export interface SocialMediaPresence {
  linkedin_company: string | null;
  instagram: string | null;
  facebook: string | null;
  youtube: string | null;
}

export interface LeadResearchResult {
  lead_id: string;
  business_name: string;
  is_real_business: boolean;
  verification_status: "verified_real" | "suspicious_bogus" | "uncertain";
  confidence: "High" | "Medium" | "Low";
  confidence_score: number; // 0 to 100
  appears_on_google: boolean;
  google_presence_notes: string;
  verified_website: string | null;
  website_status: "active" | "down" | "invalid_domain" | "unconfirmed";
  verified_email: string | null;
  email_status: "verified" | "pattern_match" | "unconfirmed" | "invalid";
  decision_maker_name: string | null;
  decision_maker_role: string | null;
  decision_maker_linkedin: string | null;
  social_media: SocialMediaPresence;
  business_summary: string;
  verification_notes: string;
  recommended_action: "Reach Out via Email" | "Manual Review Required" | "Discard as Bogus";
}
