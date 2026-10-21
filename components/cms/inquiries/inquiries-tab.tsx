"use client";

import "./inquiries.css";
import { useEffect, useMemo, useState, type FormEvent } from "react";

const INQUIRIES_STORAGE_KEY = "lf_inquiries";

const statuses = ["New", "In Progress", "Closed"] as const;
type InquiryStatus = (typeof statuses)[number];

const categories = [
  "Outbound Travel",
  "Travel Sri Lanka",
  "Hotel Bookings",
  "Trains",
  "Cruises",
] as const;
type InquiryCategory = (typeof categories)[number];

interface Inquiry {
  id: string;
  createdAt: string;
  customerName: string;
  email: string;
  phone: string;
  category: InquiryCategory;
  message: string;
  status: InquiryStatus;
  comments: string[];
}

const demoInquiries: Inquiry[] = [
  {
    id: "demo-outbound-1",
    createdAt: "2026-10-21T09:35:00.000Z",
    customerName: "Amelia Perera",
    email: "amelia.perera@example.com",
    phone: "+94 77 123 4567",
    category: "Outbound Travel",
    message: "We are planning a family holiday to Japan for two adults and two children in December. Could you share package options and estimated costs?",
    status: "New",
    comments: [],
  },
  {
    id: "demo-srilanka-1",
    createdAt: "2026-10-20T13:10:00.000Z",
    customerName: "Daniel Fernando",
    email: "daniel.fernando@example.com",
    phone: "+94 71 234 5678",
    category: "Travel Sri Lanka",
    message: "Looking for a 5-day cultural tour covering Kandy, Sigiriya, and Anuradhapura for three guests.",
    status: "In Progress",
    comments: ["Asked the customer to confirm preferred travel dates."],
  },
  {
    id: "demo-hotel-1",
    createdAt: "2026-10-19T07:45:00.000Z",
    customerName: "Nisha Jayawardena",
    email: "nisha.j@example.com",
    phone: "+94 76 345 6789",
    category: "Hotel Bookings",
    message: "Please check availability for a double room in Galle from 12 to 15 November, including breakfast.",
    status: "New",
    comments: [],
  },
  {
    id: "demo-train-1",
    createdAt: "2026-10-18T11:20:00.000Z",
    customerName: "Oliver Smith",
    email: "oliver.smith@example.com",
    phone: "+44 7700 900123",
    category: "Trains",
    message: "Can you arrange two reserved seats on the scenic train from Kandy to Ella on 8 December?",
    status: "Closed",
    comments: ["Train seats confirmed and details sent to the customer."],
  },
  {
    id: "demo-cruise-1",
    createdAt: "2026-10-17T15:05:00.000Z",
    customerName: "Ravi Kumar",
    email: "ravi.kumar@example.com",
    phone: "+91 98765 43210",
    category: "Cruises",
    message: "Interested in a Maldives cruise in January. Please send itinerary and cabin pricing for two people.",
    status: "In Progress",
    comments: [],
  },
  {
    id: "demo-outbound-2",
    createdAt: "2026-10-16T08:15:00.000Z",
    customerName: "Sophie Martin",
    email: "sophie.martin@example.com",
    phone: "+33 6 12 34 56 78",
    category: "Outbound Travel",
    message: "I would like to know whether you offer a guided group tour to Vietnam in March next year.",
    status: "New",
    comments: [],
  },
];

function normalizeInquiry(value: unknown): Inquiry | null {
  if (typeof value !== "object" || value === null) return null;
  const inquiry = value as Record<string, unknown>;
  const status = inquiry.status ?? "New";
  if (
    typeof inquiry.id !== "string" ||
    typeof inquiry.createdAt !== "string" ||
    typeof inquiry.customerName !== "string" ||
    (inquiry.email !== undefined && typeof inquiry.email !== "string") ||
    (inquiry.phone !== undefined && typeof inquiry.phone !== "string") ||
    !categories.includes(inquiry.category as InquiryCategory) ||
    typeof inquiry.message !== "string" ||
    !statuses.includes(status as InquiryStatus) ||
    (inquiry.comments !== undefined &&
      (!Array.isArray(inquiry.comments) ||
        !inquiry.comments.every((comment) => typeof comment === "string")))
  ) {
    return null;
  }

  return {
    id: inquiry.id,
    createdAt: inquiry.createdAt,
    customerName: inquiry.customerName,
    email: typeof inquiry.email === "string" ? inquiry.email : "",
    phone: typeof inquiry.phone === "string" ? inquiry.phone : "",
    category: inquiry.category as InquiryCategory,
    message: inquiry.message,
    status: status as InquiryStatus,
    comments: Array.isArray(inquiry.comments) ? inquiry.comments : [],
  };
}

function readInquiries(): Inquiry[] {
  const stored = localStorage.getItem(INQUIRIES_STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(INQUIRIES_STORAGE_KEY, JSON.stringify(demoInquiries));
    return demoInquiries;
  }

  const records: unknown = JSON.parse(stored);
  if (!Array.isArray(records)) {
    throw new Error("Saved inquiry data has an invalid format.");
  }
  const normalized: Inquiry[] = [];
  for (const record of records) {
    const inquiry = normalizeInquiry(record);
    if (!inquiry) throw new Error("Saved inquiry data has an invalid format.");
    normalized.push(inquiry);
  }
  return normalized;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
}

export default function InquiriesTab() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [storageError, setStorageError] = useState("");
  const [activeCategory, setActiveCategory] = useState<InquiryCategory | "All">("All");
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [commentInquiryId, setCommentInquiryId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");

  useEffect(() => {
    function load() {
      try {
        setInquiries(readInquiries());
        setStorageError("");
      } catch (error) {
        console.error("Could not load inquiries.", error);
        setStorageError("Inquiries could not be loaded from browser storage.");
      }
    }
    function handleStorage(event: StorageEvent) {
      if (event.key === INQUIRIES_STORAGE_KEY) load();
    }

    load();
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const counts = useMemo(() => ({
    categories: Object.fromEntries(
      categories.map((category) => [
        category,
        inquiries.filter((inquiry) => inquiry.category === category).length,
      ]),
    ) as Record<InquiryCategory, number>,
  }), [inquiries]);

  const filteredInquiries = activeCategory === "All"
    ? inquiries
    : inquiries.filter((inquiry) => inquiry.category === activeCategory);
  const pendingCount = filteredInquiries.filter((inquiry) => inquiry.status !== "Closed").length;
  const completedCount = filteredInquiries.filter((inquiry) => inquiry.status === "Closed").length;

  function changeStatus(inquiryId: string, status: InquiryStatus) {
    const updated = inquiries.map((inquiry) =>
      inquiry.id === inquiryId ? { ...inquiry, status } : inquiry,
    );

    try {
      localStorage.setItem(INQUIRIES_STORAGE_KEY, JSON.stringify(updated));
      setInquiries(updated);
      setStorageError("");
    } catch (error) {
      console.error("Could not update inquiry status.", error);
      setStorageError("The status change could not be saved. Please try again.");
    }
  }

  function addComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const comment = commentText.trim();
    if (!comment || !commentInquiryId) return;

    const updated = inquiries.map((inquiry) =>
      inquiry.id === commentInquiryId
        ? { ...inquiry, comments: [...inquiry.comments, comment] }
        : inquiry,
    );
    try {
      localStorage.setItem(INQUIRIES_STORAGE_KEY, JSON.stringify(updated));
      setInquiries(updated);
      setCommentText("");
      setCommentInquiryId(null);
      setStorageError("");
    } catch (error) {
      console.error("Could not save inquiry comment.", error);
      setStorageError("The comment could not be saved. Please try again.");
    }
  }

  const commentInquiry = inquiries.find((inquiry) => inquiry.id === commentInquiryId);
  const detailInquiry = selectedInquiry
    ? inquiries.find((inquiry) => inquiry.id === selectedInquiry.id) ?? selectedInquiry
    : null;

  return (
    <div className="cms-inquiries">
      <section aria-label="Inquiry totals" className="inquiry-summary">
        <article className="inquiry-summary-card inquiry-summary-total">
          <span>Total inquiries</span>
          <strong>{filteredInquiries.length}</strong>
        </article>
        <article className="inquiry-summary-card inquiry-summary-pending">
          <span>Pending</span>
          <strong>{pendingCount}</strong>
        </article>
        <article className="inquiry-summary-card inquiry-summary-completed">
          <span>Completed</span>
          <strong>{completedCount}</strong>
        </article>
      </section>

      {storageError && <p className="inquiry-alert" role="alert">{storageError}</p>}

      <section aria-labelledby="inquiry-list-heading" className="inquiry-list">
        <header className="inquiry-list-heading">
          <div>
            <h2 id="inquiry-list-heading">All inquiries</h2>
            <p>{filteredInquiries.length} {filteredInquiries.length === 1 ? "inquiry" : "inquiries"}</p>
          </div>
        </header>
        <nav aria-label="Filter inquiries by category" className="inquiry-category-tabs">
          <button
            aria-pressed={activeCategory === "All"}
            className={activeCategory === "All" ? "active" : ""}
            onClick={() => setActiveCategory("All")}
            type="button"
          >
            All <span>{inquiries.length}</span>
          </button>
          {categories.map((category) => (
            <button
              aria-pressed={activeCategory === category}
              className={activeCategory === category ? "active" : ""}
              key={category}
              onClick={() => setActiveCategory(category)}
              type="button"
            >
              {category} <span>{counts.categories[category]}</span>
            </button>
          ))}
        </nav>
        {filteredInquiries.length === 0 ? (
          <div className="inquiry-empty">
            <span aria-hidden="true" className="inquiry-empty-icon">✉</span>
            <h3>{inquiries.length === 0 ? "No inquiries yet" : "No inquiries in this category"}</h3>
            <p>{inquiries.length === 0 ? "Inquiries submitted through the website contact forms will appear here." : "Choose another category to see its inquiries."}</p>
          </div>
        ) : (
          <div className="inquiry-rows">
            {filteredInquiries.map((inquiry) => (
              <article className="inquiry-row" key={inquiry.id}>
                <div className="inquiry-details">
                  <time className="inquiry-date" dateTime={inquiry.createdAt}>
                    {formatDate(inquiry.createdAt)}
                  </time>
                  <h3>{inquiry.customerName}</h3>
                  <div className="inquiry-contact">
                    {inquiry.email && <a href={`mailto:${inquiry.email}`}>{inquiry.email}</a>}
                    {inquiry.phone && <a href={`tel:${inquiry.phone}`}>{inquiry.phone}</a>}
                  </div>
                  <span className="inquiry-category">{inquiry.category}</span>
                  <p className="inquiry-message">{inquiry.message}</p>
                </div>
                <div aria-label={`Status for ${inquiry.customerName}`} className="inquiry-status-actions">
                  {statuses.map((status) => (
                    <button
                      aria-pressed={inquiry.status === status}
                      className={`inquiry-status-button${inquiry.status === status ? " selected" : ""}`}
                      key={status}
                      onClick={() => changeStatus(inquiry.id, status)}
                      type="button"
                    >
                      {status}
                    </button>
                  ))}
                  <button className="inquiry-row-action" onClick={() => {
                    setCommentInquiryId(inquiry.id);
                    setCommentText("");
                  }} type="button">Add comment</button>
                  <button className="inquiry-row-action" onClick={() => setSelectedInquiry(inquiry)} type="button">View details</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      {commentInquiry && (
        <div className="inquiry-modal-backdrop" onClick={() => setCommentInquiryId(null)}>
          <section
            aria-labelledby="inquiry-comment-title"
            aria-modal="true"
            className="inquiry-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <header>
              <div>
                <h2 id="inquiry-comment-title">Add a comment</h2>
                <p>For {commentInquiry.customerName}</p>
              </div>
              <button aria-label="Close" onClick={() => setCommentInquiryId(null)} type="button">×</button>
            </header>
            <form onSubmit={addComment}>
              <label htmlFor="inquiry-comment">Comment</label>
              <textarea
                autoFocus
                id="inquiry-comment"
                onChange={(event) => setCommentText(event.target.value)}
                placeholder="Add an internal note about this inquiry"
                required
                rows={4}
                value={commentText}
              />
              <footer>
                <button className="inquiry-row-action" onClick={() => setCommentInquiryId(null)} type="button">Cancel</button>
                <button className="inquiry-modal-primary" type="submit">Save comment</button>
              </footer>
            </form>
          </section>
        </div>
      )}
      {detailInquiry && (
        <div className="inquiry-modal-backdrop" onClick={() => setSelectedInquiry(null)}>
          <section
            aria-labelledby="inquiry-detail-title"
            aria-modal="true"
            className="inquiry-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <header>
              <div>
                <h2 id="inquiry-detail-title">Inquiry details</h2>
                <p>{detailInquiry.category} · {formatDate(detailInquiry.createdAt)}</p>
              </div>
              <button aria-label="Close" onClick={() => setSelectedInquiry(null)} type="button">×</button>
            </header>
            <dl className="inquiry-detail-fields">
              <div><dt>Customer</dt><dd>{detailInquiry.customerName}</dd></div>
              <div><dt>Email</dt><dd>{detailInquiry.email || "Not provided"}</dd></div>
              <div><dt>Phone</dt><dd>{detailInquiry.phone || "Not provided"}</dd></div>
              <div><dt>Status</dt><dd>{detailInquiry.status}</dd></div>
              <div className="inquiry-detail-message"><dt>Message</dt><dd>{detailInquiry.message}</dd></div>
            </dl>
            <div className="inquiry-comments">
              <h3>Comments ({detailInquiry.comments.length})</h3>
              {detailInquiry.comments.length > 0 ? (
                <ul>{detailInquiry.comments.map((comment, index) => <li key={`${detailInquiry.id}-${index}`}>{comment}</li>)}</ul>
              ) : <p>No comments yet.</p>}
            </div>
            <footer>
              <button className="inquiry-row-action" onClick={() => setSelectedInquiry(null)} type="button">Close</button>
              <button className="inquiry-modal-primary" onClick={() => {
                setSelectedInquiry(null);
                setCommentInquiryId(detailInquiry.id);
                setCommentText("");
              }} type="button">Add comment</button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
}
