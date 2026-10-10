const API_BASE_URL = "https://campusconnect-hraj.onrender.com/api";

const API_URL = `${API_BASE_URL}/events`;
const REGISTRATIONS_API_URL = `${API_BASE_URL}/registrations`;

let adminKey = "";

export function setAdminKey(key) {
  adminKey = typeof key === "string" ? key.trim() : "";
}

export function clearAdminKey() {
  adminKey = "";
}

async function request(url, options = {}) {
  const isWriteRequest = ["POST", "PUT", "PATCH", "DELETE"].includes(
    (options.method || "GET").toUpperCase()
  );

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (isWriteRequest && adminKey) {
    headers["x-admin-key"] = adminKey;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.message || "Request failed.");
  }

  return result;
}

function extractEvents(result) {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result.data)) return result.data;
  if (Array.isArray(result.events)) return result.events;
  if (Array.isArray(result.data?.events)) return result.data.events;

  return [];
}

function formatEvent(event) {
  return {
    ...event,
    id: event._id || event.id,
    date: event.date
      ? new Date(event.date)
          .toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            timeZone: "UTC",
          })
          .toUpperCase()
      : "",
  };
}

export async function getEvents() {
  const result = await request(API_URL);
  return extractEvents(result).map(formatEvent);
}

export async function createEvent(event) {
  const result = await request(API_URL, {
    method: "POST",
    body: JSON.stringify(event),
  });

  const createdEvent = result.data || result.event || result;

  if (!createdEvent._id && !createdEvent.id) {
    throw new Error("The server did not return the created event.");
  }

  return formatEvent(createdEvent);
}

export async function updateEvent(id, event) {
  const result = await request(`${API_URL}/${id}`, {
    method: "PUT",
    body: JSON.stringify(event),
  });

  return formatEvent(result.data || result.event || result);
}

export async function deleteEvent(id) {
  return request(`${API_URL}/${id}`, {
    method: "DELETE",
  });
}

// Register a student for an event without requiring an account.
export async function registerForEvent(registration) {
  return request(REGISTRATIONS_API_URL, {
    method: "POST",
    body: JSON.stringify(registration),
  });
}

// Retrieve a registration using its unique pass ID.
export async function getRegistrationPass(passId) {
  if (!passId || typeof passId !== "string") {
    throw new Error("A valid registration pass ID is required.");
  }

  return request(
    `${REGISTRATIONS_API_URL}/${encodeURIComponent(passId)}`
  );
}
