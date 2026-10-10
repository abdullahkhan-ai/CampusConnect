import { useCallback, useEffect, useState } from "react";

import { QRCodeSVG } from "qrcode.react";

import {

House,

CalendarDays,

Images,

Megaphone,

ShieldCheck,

LockKeyhole,

Unlock,

Target,

Video,

Plus,

Search,

Bell,

ArrowUpRight,

MapPin,

Clock3,

Users,

X,

Menu,

Sparkles,

ChevronRight,

LoaderCircle,

RefreshCw,

AlertCircle,

Trash2,

Pencil,

} from "lucide-react";

import {

  getEvents,

  createEvent,

  updateEvent,

  deleteEvent,

  setAdminKey,

  clearAdminKey,

  registerForEvent,

  getRegistrationPass,

} from "./services/eventService";

const navigation = [

{ label: "Dashboard", icon: House },

{ label: "All Events", icon: CalendarDays },

{ label: "Event Updates", icon: Megaphone },
{ label: "Photo Gallery", icon: Images },
{ label: "Announcements", icon: Bell },

];

const emptyForm = {

title: "",

category: "WORKSHOP",

date: "",

time: "",

venue: "",

description: "",

status: "Registration Open",

};

function App() {

const [events, setEvents] = useState([]);

const [activePage, setActivePage] = useState("Dashboard");

const [search, setSearch] = useState("");

const [showForm, setShowForm] = useState(false);

const [mobileMenu, setMobileMenu] = useState(false);

const [notice, setNotice] = useState("");

const [error, setError] = useState("");

const [loading, setLoading] = useState(true);

const [saving, setSaving] = useState(false);

const [deletingId, setDeletingId] = useState(null);

const [isAdmin, setIsAdmin] = useState(false);

const [showAdminUnlock, setShowAdminUnlock] = useState(false);

const [adminKeyInput, setAdminKeyInput] = useState("");

const [adminUnlocking, setAdminUnlocking] = useState(false);

const [deleteTarget, setDeleteTarget] = useState(null);

const [editingEvent, setEditingEvent] = useState(null);

const [form, setForm] = useState(emptyForm);

const [registrationEvent, setRegistrationEvent] = useState(null);

const [registrationForm, setRegistrationForm] = useState({ studentName: "", email: "", studentId: "" });

const [registrationSaving, setRegistrationSaving] = useState(false);

const [registrationError, setRegistrationError] = useState("");

const [entryPass, setEntryPass] = useState(null);

const loadEvents = useCallback(async () => {

setLoading(true);

setError("");

try {

const savedEvents = await getEvents();

setEvents(savedEvents);

} catch (err) {

setError(

`${err.message} Make sure the backend is running and MongoDB Atlas is connected.`

);

} finally {

setLoading(false);

}

}, []);

useEffect(() => {

loadEvents();

}, [loadEvents]);

const visibleEvents = events.filter((event) => {

const query = search.trim().toLowerCase();

return (

event.title?.toLowerCase().includes(query) ||

event.category?.toLowerCase().includes(query) ||

event.venue?.toLowerCase().includes(query)

);

});

const registrationCount = events.reduce(

(total, event) => total + (Number(event.registrations) || 0),

0

);

function openRegistration(event) {

  setRegistrationEvent(event);

  setRegistrationForm({ studentName: "", email: "", studentId: "" });

  setRegistrationError("");

  setEntryPass(null);

}



async function handleRegisterStudent(e) {

  e.preventDefault();

  if (!registrationEvent?.id) {

    setRegistrationError("Please select a valid event.");

    return;

  }

  setRegistrationSaving(true);

  setRegistrationError("");

  try {

    const response = await registerForEvent({

      eventId: registrationEvent.id,

      studentName: registrationForm.studentName.trim(),

      email: registrationForm.email.trim(),

      studentId: registrationForm.studentId.trim(),

    });

    const registration = response.data || response.registration || response;

    const passId = registration.passId || registration.registration?.passId;

    if (!passId) {

      throw new Error("Registration was received, but the server did not return a pass ID. Check the registration API response.");

    }

    setEntryPass({

      ...registration,

      passId,

      studentName: registration.studentName || registrationForm.studentName.trim(),

      eventTitle: registration.event?.title || registrationEvent.title,

      eventDate: registration.event?.date || registrationEvent.date,

      eventTime: registration.event?.time || registrationEvent.time,

      eventVenue: registration.event?.venue || registrationEvent.venue,

    });

    setEvents((previous) => previous.map((item) =>

      item.id === registrationEvent.id

        ? { ...item, registrations: (Number(item.registrations) || 0) + 1 }

        : item

    ));

    setNotice("Registration successful. Your QR entry pass is ready.");

  } catch (err) {

    setRegistrationError(err.message || "Could not complete registration.");

  } finally {

    setRegistrationSaving(false);

  }

}



function openPage(page) {

setActivePage(page);

setMobileMenu(false);

setNotice("");

setSearch("");

}

async function handleSaveEvent(e) {

e.preventDefault();

if (!isAdmin) {

setError("Unlock Admin Mode before creating events.");

return;

}

setSaving(true);

setError("");

setNotice("");

try {

const eventPayload = {

title: form.title.trim(),

category: form.category,

date: form.date,

time: form.time,

venue: form.venue.trim(),

description: form.description.trim(),

status: form.status,

};

if (editingEvent) {

const savedEvent = await updateEvent(editingEvent.id, eventPayload);

setEvents((previous) =>

previous.map((item) => item.id === editingEvent.id ? savedEvent : item)

);

setNotice("Event updated successfully in MongoDB.");

} else {

const savedEvent = await createEvent(eventPayload);

setEvents((previous) => [savedEvent, ...previous]);

setNotice("Event saved successfully to MongoDB.");

}

setForm(emptyForm);

setEditingEvent(null);

setShowForm(false);

setActivePage("All Events");

} catch (err) {

setError(err.message);

} finally {

setSaving(false);

}

}

function handleEditEvent(event) {

if (!isAdmin) {

setError("Unlock Admin Mode before editing events.");

return;

}

const rawDate = event.date ? new Date(event.date) : null;

const dateValue = rawDate && !Number.isNaN(rawDate.getTime())

? `${rawDate.getUTCFullYear()}-${String(rawDate.getUTCMonth() + 1).padStart(2, "0")}-${String(rawDate.getUTCDate()).padStart(2, "0")}`

: "";

setError("");

setNotice("");

setEditingEvent(event);

setForm({

title: event.title || "",

category: event.category || "WORKSHOP",

date: dateValue,

time: event.time || "",

venue: event.venue || "",

description: event.description || "",

status: event.status || "Registration Open",

});

setShowForm(true);

}

async function handleAdminUnlock(e) {

e.preventDefault();

const key = adminKeyInput.trim();

if (!key) {

setError("Enter your admin key.");

return;

}

setAdminUnlocking(true);

setError("");

try {

const response = await fetch("http://campusconnect-hraj.onrender.com/api/admin/verify", {

method: "GET",

headers: { "x-admin-key": key },

});

const result = await response.json().catch(() => ({}));

if (!response.ok || !result.success) {

throw new Error(result.message || "Invalid admin key.");

}

setAdminKey(key);

setIsAdmin(true);

setAdminKeyInput("");

setShowAdminUnlock(false);

setNotice("Admin Mode enabled. You can now manage events.");

} catch (err) {

setError(err.message || "Unable to verify admin access.");

} finally {

setAdminUnlocking(false);

}

}

function handleAdminLock() {

clearAdminKey();

setIsAdmin(false);

setAdminKeyInput("");

setShowAdminUnlock(false);

setNotice("Admin Mode disabled.");

}

async function handleDeleteEvent(event) {

if (!isAdmin) {

setError("Unlock Admin Mode to manage events.");

return;

}

setDeletingId(event.id);

setError("");

setNotice("");

try {

await deleteEvent(event.id);

setEvents((previous) => previous.filter((item) => item.id !== event.id));

setDeleteTarget(null);

setNotice(`"${event.title}" was deleted successfully.`);

} catch (err) {

setError(err.message || "Could not delete the event.");

} finally {

setDeletingId(null);

}

}

return (

<div className="app-shell">

<header className="topbar">

<button

className="mobile-menu-button icon-button"

onClick={() => setMobileMenu((previous) => !previous)}

aria-label="Toggle navigation"

>

{mobileMenu ? <X size={22} /> : <Menu size={22} />}

</button>

<button

className="brand"

onClick={() => openPage("Dashboard")}

aria-label="Go to dashboard"

>

<span className="brand-mark">

<Sparkles size={27} strokeWidth={2.7} />

</span>

<span className="brand-copy">

<strong>

Campus<span>Connect</span>

</strong>

<small>EVENT MANAGEMENT</small>

</span>

</button>

<div className="topbar-right">

<span className="college-label">COLLEGE EVENTS PORTAL</span>

<button

className="icon-button notification-button"

aria-label="View event updates"

onClick={() => openPage("Event Updates")}

>

<Bell size={19} />

</button>

<button

type="button"

className="button button-primary admin-mode-button"

onClick={() => (isAdmin ? handleAdminLock() : setShowAdminUnlock(true))}

title={isAdmin ? "Lock Admin Mode" : "Unlock Admin Mode"}

>

{isAdmin ? <Unlock size={16} /> : <LockKeyhole size={16} />}

{isAdmin ? "Lock Admin Mode" : "Admin Mode"}

</button>

</div>

</header>

<div className="workspace">

{mobileMenu && (

<button

className="mobile-overlay"

aria-label="Close navigation"

onClick={() => setMobileMenu(false)}

/>

)}

<aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}>

<div className="sidebar-heading">

<span className="sidebar-eyebrow">WORKSPACE</span>

<span className="sidebar-caption">Manage your campus</span>

</div>

<nav className="navigation" aria-label="Main navigation">

{navigation.map(({ label, icon: Icon }) => (

<button

key={label}

className={`nav-link ${

activePage === label ? "nav-link-active" : ""

}`}

onClick={() => openPage(label)}

aria-current={activePage === label ? "page" : undefined}

>

<Icon size={19} strokeWidth={1.9} />

<span>{label}</span>

{activePage === label && <span className="nav-indicator" />}

</button>

))}

</nav>

<div className="sidebar-bottom">

<div className="help-card">

<span className="help-icon">

<Sparkles size={17} />

</span>

<strong>Make it memorable.</strong>

<p>

Great campus moments start with great events.

</p>

</div>

<div className="admin-status-card">

<ShieldCheck size={18} />

<div>

<strong>{isAdmin ? "Admin Mode active" : "Public access"}</strong>

<span>{isAdmin ? "Event management enabled" : "Browse campus events"}</span>

</div>

</div>

<div className="sidebar-footer">CAMPUSCONNECT · 2026</div>

</div>

</aside>

<main className="main-content">

<div className="page-toolbar">

<div className="breadcrumb">

<span>Workspace</span>

<ChevronRight size={14} />

<strong>{activePage}</strong>

</div>

<span className="date-chip">

<CalendarDays size={14} />

COLLEGE EVENTS

</span>

</div>

{notice && (

<div className="notice-banner" role="status">

<span>{notice}</span>

<button

onClick={() => setNotice("")}

aria-label="Dismiss notification"

>

<X size={16} />

</button>

</div>

)}

{error && (

<div className="error-banner" role="alert">

<AlertCircle size={19} />

<div>

<strong>Something went wrong</strong>

<p>{error}</p>

</div>

<button

className="button button-secondary"

onClick={loadEvents}

disabled={loading}

>

<RefreshCw size={15} />

Retry

</button>

</div>

)}

{activePage === "Dashboard" && (

<>

<section className="hero-banner">

<div className="hero-decoration hero-decoration-one" />

<div className="hero-decoration hero-decoration-two" />

<div className="hero-content">

<span className="hero-eyebrow">

<span className="live-dot" />

YOUR CAMPUS, YOUR MOMENTS

</span>

<h1>

Hey, Abdullah <span>✦</span>

</h1>

<p>

Let's make something memorable happen on campus.

</p>

<div className="hero-actions">

{isAdmin && (

<button

className="button button-white"

onClick={() => {

setError("");

setEditingEvent(null);

setForm(emptyForm);

setShowForm(true);

}}

>

<Plus size={17} />

Create an event

</button>

)}

<button

className="button button-glass"

onClick={() => openPage("All Events")}

>

Explore events

<ArrowUpRight size={16} />

</button>

</div>

</div>

<div className="hero-art" aria-hidden="true">

<div className="art-ring art-ring-one" />

<div className="art-ring art-ring-two" />

<div className="art-card">

<CalendarDays size={39} />

<span>YOUR NEXT</span>

<strong>BIG EVENT</strong>

<div className="art-card-line" />

<small>Starts here.</small>

</div>

<span className="art-spark art-spark-one">✳</span>

<span className="art-spark art-spark-two">✦</span>

</div>

<div className="hero-bottom-label">

<span>01</span> / CAMPUS EVENT HUB

</div>

</section>

<section className="stats-grid">

<StatCard

icon={CalendarDays}

label="TOTAL EVENTS"

value={loading ? "—" : events.length}

detail="Saved in your database"

color="blue"

/>

<StatCard

icon={Users}

label="REGISTRATIONS"

value={loading ? "—" : registrationCount}

detail="Across all events"

color="purple"

/>

<StatCard

icon={Target}

label="UPCOMING EVENTS"

value={

loading

? "—"

: events.filter(

(event) =>

new Date(event.date) >=

new Date(new Date().toDateString())

).length

}

detail="From saved events"

color="orange"

/>

</section>

<SectionHeading

title="Events on campus"

description="Find your next experience. Be part of something great."

onViewAll={() => openPage("All Events")}

/>

<EventList

events={visibleEvents.slice(0, 3)}

loading={loading}

onSearch={() => openPage("All Events")}

onCreate={() => { if (isAdmin) { setEditingEvent(null); setForm(emptyForm); setShowForm(true); } }}

onDelete={(event) => setDeleteTarget(event)}

onEdit={handleEditEvent}

onRegister={openRegistration}

deletingId={deletingId}

isAdmin={isAdmin}

search={search}

setSearch={setSearch}

/>

</>

)}

{activePage === "All Events" && (

<>

<div className="section-heading events-page-heading">

<div>

<span className="section-kicker">

YOUR CAMPUS CALENDAR

</span>

<h1>

All events<span>.</span>

</h1>

<p>

Events are loaded from your connected database.

</p>

</div>

{isAdmin && (

<button

className="button button-primary"

onClick={() => {

setError("");

setEditingEvent(null);

setForm(emptyForm);

setShowForm(true);

}}

>

<Plus size={17} />

Create event

</button>

)}

</div>

<EventList

events={visibleEvents}

loading={loading}

search={search}

setSearch={setSearch}

onCreate={() => { if (isAdmin) { setEditingEvent(null); setForm(emptyForm); setShowForm(true); } }}

onSearch={() => setSearch("")}

onDelete={(event) => setDeleteTarget(event)}

onEdit={handleEditEvent}

onRegister={openRegistration}

deletingId={deletingId}

isAdmin={isAdmin}

/>

</>

)}

{activePage === "Event Updates" && (

<section className="simple-page">

<div className="simple-page-icon">

<Megaphone size={27} />

</div>

<span className="section-kicker">

CAMPUSCONNECT WORKSPACE

</span>

<h1>

Event Updates<span>.</span>

</h1>

<p>

Important announcements, schedule changes, venue updates,

and other event news will appear here.

</p>

<div className="coming-soon">

<Sparkles size={18} />

<span>

The event update publishing feature has not been built yet.

</span>

</div>

<button

className="button button-primary"

onClick={() => openPage("All Events")}

>

Browse events

<ArrowUpRight size={16} />

</button>

</section>

)}

{activePage === "Photo Gallery" && (
        <section className="simple-page">
          <div className="simple-page-icon"><Images size={27} /></div>
          <span className="section-kicker">CAMPUSCONNECT / CAMPUS MEMORIES</span>
          <h1>Photo Gallery<span>.</span></h1>
          <p>Explore photos and memorable moments from campus events, fests, workshops, and student activities.</p>
          <div className="coming-soon"><Sparkles size={18} /><span>The event photo gallery will be available here soon.</span></div>
          <button className="button button-primary" onClick={() => openPage("All Events")}>Explore events <ArrowUpRight size={16} /></button>
        </section>
      )}

      {activePage === "Announcements" && (
        <section className="simple-page">
          <div className="simple-page-icon"><Bell size={27} /></div>
          <span className="section-kicker">CAMPUSCONNECT / NOTICE BOARD</span>
          <h1>Announcements<span>.</span></h1>
          <p>Stay informed about important campus notices, event announcements, registration deadlines, and schedule updates.</p>
          <div className="coming-soon"><Sparkles size={18} /><span>The announcement publishing feature will be available here soon.</span></div>
          <button className="button button-primary" onClick={() => openPage("All Events")}>Browse events <ArrowUpRight size={16} /></button>
        </section>
      )}

      <footer className="main-footer">

<span>© 2026 CampusConnect</span>

<span>

MADE FOR CAMPUS LIFE <span className="footer-star">✦</span>

</span>

</footer>

</main>

</div>

{showAdminUnlock && (

<div className="modal-backdrop" onMouseDown={(e) => {

if (e.target === e.currentTarget && !adminUnlocking) {

setShowAdminUnlock(false);

setAdminKeyInput("");

}

}}>

<form className="event-modal admin-unlock-modal" onSubmit={handleAdminUnlock}>

<div className="modal-header">

<div>

<span className="section-kicker">CAMPUSCONNECT / PRIVATE ACCESS</span>

<h2>Unlock Admin Mode<span>.</span></h2>

<p>Enter the private admin key to create or delete campus events.</p>

</div>

<button type="button" className="icon-button" onClick={() => {

if (!adminUnlocking) {

setShowAdminUnlock(false);

setAdminKeyInput("");

}

}} disabled={adminUnlocking} aria-label="Close admin unlock">

<X size={21} />

</button>

</div>

<label className="form-label">

Admin key

<input

type="password"

autoComplete="current-password"

required

autoFocus

value={adminKeyInput}

onChange={(e) => setAdminKeyInput(e.target.value)}

placeholder="Enter your admin key"

/>

</label>

<div className="form-actions">

<button type="button" className="button button-secondary" onClick={() => {

setShowAdminUnlock(false);

setAdminKeyInput("");

}} disabled={adminUnlocking}>Cancel</button>

<button type="submit" className="button button-primary" disabled={adminUnlocking}>

{adminUnlocking ? <LoaderCircle className="spin" size={16} /> : <ShieldCheck size={16} />}

{adminUnlocking ? "Verifying..." : "Unlock Admin Mode"}

</button>

</div>

</form>

</div>

)}

{deleteTarget && (

<div className="modal-backdrop" onMouseDown={(e) => {

if (e.target === e.currentTarget && !deletingId) setDeleteTarget(null);

}}>

<div className="event-modal confirm-modal" role="dialog" aria-modal="true" aria-labelledby="delete-event-title">

<div className="modal-header">

<div>

<span className="section-kicker">CAMPUSCONNECT / CONFIRMATION</span>

<h2 id="delete-event-title">Delete this event<span>?</span></h2>

<p>This permanently removes <strong>{deleteTarget.title}</strong> from the database.</p>

</div>

<button type="button" className="icon-button" onClick={() => setDeleteTarget(null)} disabled={Boolean(deletingId)} aria-label="Close confirmation">

<X size={21} />

</button>

</div>

<div className="form-actions">

<button type="button" className="button button-secondary" onClick={() => setDeleteTarget(null)} disabled={Boolean(deletingId)}>Cancel</button>

<button type="button" className="button button-danger" onClick={() => handleDeleteEvent(deleteTarget)} disabled={Boolean(deletingId)}>

{deletingId ? <LoaderCircle className="spin" size={16} /> : <Trash2 size={16} />}

{deletingId ? "Deleting..." : "Delete event"}

</button>

</div>

</div>

</div>

)}

{registrationEvent && (

  <div className="modal-backdrop" onMouseDown={(e) => {

    if (e.target === e.currentTarget && !registrationSaving) {

      setRegistrationEvent(null);

      setEntryPass(null);

    }

  }}>

    <div className="event-modal" role="dialog" aria-modal="true" aria-labelledby="student-registration-title">

      {!entryPass ? (

        <form onSubmit={handleRegisterStudent}>

          <div className="modal-header">

            <div>

              <span className="section-kicker">CAMPUSCONNECT / STUDENT REGISTRATION</span>

              <h2 id="student-registration-title">Register for event<span>.</span></h2>

              <p>{registrationEvent.title}</p>

            </div>

            <button type="button" className="icon-button" onClick={() => setRegistrationEvent(null)} disabled={registrationSaving} aria-label="Close registration">

              <X size={21} />

            </button>

          </div>

          <label className="form-label">Student name *

            <input required maxLength={100} autoComplete="name" value={registrationForm.studentName}

              onChange={(e) => setRegistrationForm({ ...registrationForm, studentName: e.target.value })}

              placeholder="Enter your full name" />

          </label>

          <label className="form-label">Email address *

            <input required type="email" maxLength={254} autoComplete="email" value={registrationForm.email}

              onChange={(e) => setRegistrationForm({ ...registrationForm, email: e.target.value })}

              placeholder="you@example.com" />

          </label>

          <label className="form-label">Student ID *

            <input required maxLength={50} autoComplete="off" value={registrationForm.studentId}

              onChange={(e) => setRegistrationForm({ ...registrationForm, studentId: e.target.value })}

              placeholder="Enter your college student ID" />

          </label>

          {registrationError && <div className="form-error" role="alert"><AlertCircle size={16} /><span>{registrationError}</span></div>}

          <div className="modal-actions">

            <button type="button" className="button button-secondary" onClick={() => setRegistrationEvent(null)} disabled={registrationSaving}>Cancel</button>

            <button type="submit" className="button button-primary" disabled={registrationSaving}>

              {registrationSaving ? <LoaderCircle className="spin" size={17} /> : <CalendarDays size={17} />}

              {registrationSaving ? "Registering..." : "Complete Registration"}

            </button>

          </div>

          <p className="form-note">No account or login is required. Your details will be used for this event registration.</p>

        </form>

      ) : (

        <div className="entry-pass-content">

          <div className="modal-header">

            <div>

              <span className="section-kicker">CAMPUSCONNECT / ENTRY PASS</span>

              <h2>You're registered<span>!</span></h2>

              <p>Keep this QR code ready for event entry.</p>

            </div>

            <button type="button" className="icon-button" onClick={() => { setRegistrationEvent(null); setEntryPass(null); }} aria-label="Close entry pass">

              <X size={21} />

            </button>

          </div>

          <div style={{ display: "flex", justifyContent: "center", padding: "18px 0" }}>

            <div style={{ background: "#fff", padding: 14, borderRadius: 12 }}>

              <QRCodeSVG value={`CAMPUSCONNECT-PASS:${entryPass.passId}`} size={220} level="H" includeMargin />

            </div>

          </div>

          <div className="entry-pass-details">

            <h3>{entryPass.eventTitle}</h3>

            <p><strong>Student:</strong> {entryPass.studentName}</p>

            <p><strong>Date:</strong> {entryPass.eventDate || "See event details"}</p>

            <p><strong>Time:</strong> {entryPass.eventTime || "To be announced"}</p>

            <p><strong>Venue:</strong> {entryPass.eventVenue || "See event details"}</p>

            <p><strong>Pass ID:</strong> {entryPass.passId}</p>

          </div>

          <div className="modal-actions">

            <button type="button" className="button button-primary" onClick={() => window.print()}>

              Print / Save Pass

            </button>

            <button type="button" className="button button-secondary" onClick={() => { setRegistrationEvent(null); setEntryPass(null); }}>

              Done

            </button>

          </div>

          <p className="form-note">The QR contains only your unique pass ID. Keep this pass available for event check-in.</p>

        </div>

      )}

    </div>

  </div>

)}

{showForm && (

<div

className="modal-backdrop"

onMouseDown={(e) => {

if (e.target === e.currentTarget && !saving) {

setShowForm(false);

}

}}

>

<form className="event-modal" onSubmit={handleSaveEvent}>

<div className="modal-header">

<div>

<span className="section-kicker">

CAMPUSCONNECT / EVENTS

</span>

<h2>

{editingEvent ? "Edit event" : "Create an event"}<span>.</span>

</h2>

<p>

{editingEvent ? "Update the event details and save your changes." : "Complete the details and save your event to MongoDB."}

</p>

</div>

<button

type="button"

className="icon-button"

onClick={() => !saving && setShowForm(false)}

disabled={saving}

aria-label="Close form"

>

<X size={21} />

</button>

</div>

<label className="form-label">

Event title *

<input

required

maxLength={100}

value={form.title}

onChange={(e) =>

setForm({ ...form, title: e.target.value })

}

placeholder="e.g. Annual Tech Fest"

/>

</label>

<div className="form-row">

<label className="form-label">

Category *

<select

required

value={form.category}

onChange={(e) =>

setForm({ ...form, category: e.target.value })

}

>

<option value="WORKSHOP">Workshop</option>

<option value="TECHNOLOGY">Technology</option>

<option value="CULTURAL">Cultural</option>

<option value="SEMINAR">Seminar</option>

<option value="COMPETITION">Competition</option>

<option value="SPORTS">Sports</option>

</select>

</label>

<label className="form-label">

Event date *

<input

required

type="date"

min={new Date().toLocaleDateString("en-CA")}

value={form.date}

onChange={(e) =>

setForm({ ...form, date: e.target.value })

}

/>

</label>

</div>

<div className="form-row">

<label className="form-label">

Start time

<input

type="time"

value={form.time}

onChange={(e) =>

setForm({ ...form, time: e.target.value })

}

/>

</label>

<label className="form-label">

Venue *

<input

required

maxLength={200}

value={form.venue}

onChange={(e) =>

setForm({ ...form, venue: e.target.value })

}

placeholder="e.g. Main Auditorium"

/>

</label>

</div>

<label className="form-label">

Registration status *

<select

required

value={form.status}

onChange={(e) => setForm({ ...form, status: e.target.value })}

>

<option value="Registration Open">Registration Open</option>

<option value="Coming Soon">Coming Soon</option>

<option value="Registration Closed">Registration Closed</option>

<option value="Completed">Completed</option>

<option value="Cancelled">Cancelled</option>

</select>

</label>

<label className="form-label">

Description *

<textarea

required

rows={3}

maxLength={1000}

value={form.description}

onChange={(e) =>

setForm({ ...form, description: e.target.value })

}

placeholder="What should participants know about this event?"

/>

</label>

{error && (

<div className="form-error" role="alert">

<AlertCircle size={16} />

<span>{error}</span>

</div>

)}

<div className="modal-actions">

<button

type="button"

className="button button-secondary"

disabled={saving}

onClick={() => setShowForm(false)}

>

Cancel

</button>

<button

type="submit"

className="button button-primary"

disabled={saving}

>

{saving ? (

<>

<LoaderCircle className="spin" size={17} />

Saving...

</>

) : (

<>

{editingEvent ? <Pencil size={17} /> : <Plus size={17} />}

{editingEvent ? "Save changes" : "Save event"}

</>

)}

</button>

</div>

<p className="form-note">

The event is saved only after the server confirms successful

database storage.

</p>

</form>

</div>

)}

</div>

);

}

function StatCard({ icon: Icon, label, value, detail, color }) {

return (

<article className="stat-card">

<div className={`stat-icon ${color}`}>

<Icon size={20} />

</div>

<div className="stat-info">

<span>{label}</span>

<div className="stat-value">{value}</div>

<small>{detail}</small>

</div>

<ArrowUpRight className="stat-arrow" size={17} />

</article>

);

}

function SectionHeading({ title, description, onViewAll }) {

return (

<div className="section-heading">

<div>

<span className="section-kicker">

DISCOVER WHAT'S HAPPENING

</span>

<h2>

{title}<span>.</span>

</h2>

<p>{description}</p>

</div>

<button className="text-link" onClick={onViewAll}>

View all events

<ArrowUpRight size={16} />

</button>

</div>

);

}

function EventList({

events,

loading,

search,

setSearch,

onCreate,

onSearch,

onDelete,

onEdit,

onRegister,

deletingId,

isAdmin,

}) {

return (

<>

<div className="event-controls">

<div className="event-count">

<span className="count-dot" />

<strong>{loading ? "Loading events..." : `${events.length} events`}</strong>

{!loading && <span>· Saved event records</span>}

</div>

<label className="search-box">

<Search size={17} />

<input

value={search}

onChange={(e) => setSearch(e.target.value)}

placeholder="Search events..."

aria-label="Search events"

/>

{search && (

<button

type="button"

onClick={onSearch}

aria-label="Clear search"

>

<X size={15} />

</button>

)}

</label>

</div>

{loading ? (

<div className="loading-state">

<LoaderCircle className="spin" size={29} />

<p>Loading your saved events...</p>

</div>

) : events.length > 0 ? (

<section className="events-grid">

{events.map((event) => (

<EventCard

key={event.id}

event={event}

onDelete={onDelete}

onEdit={onEdit}

onRegister={onRegister}

deleting={deletingId === event.id}

isAdmin={isAdmin}

/>

))}

</section>

) : (

<div className="empty-state">

<CalendarDays size={29} />

<h3>No saved events yet</h3>

<p>

{search

? "Try another search term."

: "Create your first event. It will be stored in MongoDB."}

</p>

{search ? (

<button

className="button button-secondary"

onClick={onSearch}

>

Clear search

</button>

) : isAdmin ? (

<button className="button button-primary" onClick={onCreate}>

<Plus size={16} />

Create an event

</button>

) : null}

</div>

)}

</>

);

}

function EventCard({ event, onDelete, onEdit, onRegister, deleting, isAdmin }) {

const color = event.color || "blue";

return (

<article className="event-card">

<div className={`event-cover ${color}`}>

<div className="cover-topline">

<span className="category-pill">{event.category}</span>

<span className="cover-number">CAMPUS / EVENT</span>

</div>

<div className="cover-art">

<div className="cover-orbit orbit-one" />

<div className="cover-orbit orbit-two" />

<div className="cover-icon">

{color === "purple" ? (

<Sparkles size={39} />

) : color === "orange" ? (

<Video size={39} />

) : (

<Target size={39} />

)}

</div>

<span className="cover-star">✳</span>

<span className="cover-star cover-star-two">✦</span>

</div>

<div className="cover-caption">

<span>YOUR NEXT EXPERIENCE</span>

<strong>{event.title}</strong>

</div>

</div>

<div className="event-card-body">

<div className="event-date-row">

<span className="event-date">

<CalendarDays size={14} />

{event.date || "DATE TBA"}

</span>

<span

className={`event-status ${

event.status === "Coming Soon" ? "status-soon" : ""

}`}

>

<span />

{event.status || "Registration Open"}

</span>

</div>

<h3>{event.title}</h3>

<p className="event-description">{event.description}</p>

<div className="event-meta">

<span>

<Clock3 size={15} />

{event.time || "Time TBA"}

</span>

<span>

<MapPin size={15} />

{event.venue}

</span>

</div>

<div className="event-card-footer">

<span className="registration-count">

<Users size={15} />

{event.registrations || 0} registered

</span>

<div className="event-card-actions">

<span className="event-action">

Saved

<ArrowUpRight size={16} />

</span>

{!isAdmin && event.status === "Registration Open" && (

<button

  type="button"

  className="button button-primary"

  onClick={() => onRegister(event)}

  disabled={deleting}

>

  Register for Event

  <ArrowUpRight size={15} />

</button>

)}

{isAdmin && (

<>

<button

type="button"

className="button button-secondary event-edit-button"

onClick={() => onEdit(event)}

disabled={deleting}

aria-label={`Edit ${event.title}`}

title="Edit event"

>

<Pencil size={15} />

Edit

</button>

<button

type="button"

className="button button-danger event-delete-button"

onClick={() => onDelete(event)}

disabled={deleting}

aria-label={`Delete ${event.title}`}

title="Delete event"

>

<Trash2 size={15} />

Delete

</button>

</>

)}

</div>

</div>

</div>

</article>

);

}

export default App;
