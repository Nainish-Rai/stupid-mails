// Gmail API Response Types
export interface GmailProfile {
  emailAddress: string;
  messagesTotal: number;
  threadsTotal: number;
  historyId: string;
}

export interface GmailLabel {
  id: string;
  name: string;
  type: "system" | "user";
  messageListVisibility: "show" | "hide";
  labelListVisibility: "labelShow" | "labelHide" | "labelShowIfUnread";
  messagesTotal?: number;
  messagesUnread?: number;
  threadsTotal?: number;
  threadsUnread?: number;
  color?: {
    textColor: string;
    backgroundColor: string;
  };
}

export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  payload?: {
    mimeType: string;
    headers: {
      name: string;
      value: string;
    }[];
    parts?: GmailMessagePart[];
    body?: GmailMessagePartBody;
  };
  sizeEstimate: number;
  historyId: string;
  internalDate: string;
}

export interface GmailMessagePart {
  partId: string;
  mimeType: string;
  filename: string;
  headers: {
    name: string;
    value: string;
  }[];
  body: GmailMessagePartBody;
  parts?: GmailMessagePart[];
}

export interface GmailMessagePartBody {
  size: number;
  data?: string;
  attachmentId?: string;
}

// Request Types
export interface EmailFetchOptions {
  maxResults?: number;
  pageToken?: string;
  labelIds?: string[];
  q?: string;
}

export interface ListEmailsResponse {
  emails: GmailMessage[];
  nextPageToken?: string;
}

export interface CreateLabelOptions {
  name: string;
  messageListVisibility?: "show" | "hide";
  labelListVisibility?: "labelShow" | "labelHide" | "labelShowIfUnread";
  color?: {
    textColor: string;
    backgroundColor: string;
  };
}

export interface UpdateLabelOptions {
  name?: string;
  messageListVisibility?: "show" | "hide";
  labelListVisibility?: "labelShow" | "labelHide" | "labelShowIfUnread";
  color?: {
    textColor: string;
    backgroundColor: string;
  };
}

// Email Helpers
export interface EmailMetadata {
  id: string;
  threadId: string;
  subject: string;
  sender: string;
  receivedAt: Date;
  snippet: string;
  labelIds: string[];
  isRead: boolean;
}

// Custom Errors
export interface GmailErrorDetails {
  code: string;
  message: string;
  retriable: boolean;
}

// Sync Status
export interface SyncStatus {
  lastSyncTime: Date;
  emailsProcessed: number;
  lastHistoryId: string;
  inProgress: boolean;
}
