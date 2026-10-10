
const API_URL = "http://localhost:5000/api/events";

async function handleResponse(response) {
  const result = await response.json().catch(() => ({}));

  if (!response.ok || result.success === false) {
    const details = Array.isArray(result.errors)
      ? ` ${result.errors.join(" ")}`
      : "";

    throw new Error(
      `${result.message || "Something went wrong."}${details}`
    );
  }

  return result;
}

export async function getEvents() {
  const response = await fetch(API_URL);
  const result = await handleResponse(response);

  return result.data.map((event) => ({
    ...event,
    id: event._id,
    date: event.date
      ? new Date(event.date).toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
          timeZone: "UTC",
        }).toUpperCase()
      : "",
  }));
}

export async function createEvent(eventData) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(eventData),
  });

  const result = await handleResponse(response);

  return {
    ...result.data,
    id: result.data._id,
    date: result.data.date
      ? new Date(result.data.date).toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
          timeZone: "UTC",
        }).toUpperCase()
      : "",
  };
}

export async function updateEvent(id, eventData) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(eventData),
  });

  const result = await handleResponse(response);

  return {
    ...result.data,
    id: result.data._id,
  };
}

export async function deleteEvent(id) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });

  return handleResponse(response);
}
