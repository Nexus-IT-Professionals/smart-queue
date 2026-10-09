// biome-ignore lint/suspicious/noRedundantUseStrict: This is a classic browser script, not an ES module.
"use strict";
(() => {
	const narrative = [
		{
			seconds: 9,
			script:
				"Meet María, Ana, José, and Dr. Rivera. One cancellation connects their day. Smart Queue helps turn that opening into a clear next step.",
			cue: "Introduce the four fictional characters.",
		},
		{
			seconds: 12,
			script:
				"An empty appointment and a waiting patient can exist at the same time. Manual follow-up makes the connection difficult. Why now? We can start by using available capacity more clearly.",
			cue: "Pause between availability and access. No statistics claimed.",
		},
		{
			seconds: 12,
			script:
				"María needs to cancel unexpectedly. She wants the office to know, without uncertainty. Our POC begins when staff confirms that cancellation; patient self-cancellation is still future work.",
			cue: "Point to María. This is the story, not an app screen.",
		},
		{
			seconds: 13,
			script:
				"Ana now has several jobs: update the schedule, contact waiting patients, and track replies. When those steps are disconnected, the assistant becomes the link between everything.",
			cue: "Emphasize the operational burden, not blame.",
		},
		{
			seconds: 12,
			script:
				"José would welcome an earlier visit. But he cannot accept an opening he never hears about. The opportunity is to connect available time with a patient who can use it.",
			cue: "Let the short dialogue carry the emotion.",
		},
		{
			seconds: 14,
			script:
				"Smart Queue connects three handoffs: staff confirms, the patient chooses, and the schedule updates. The working demo offers English and Spanish, without credentials. People remain in control of the decision.",
			cue: "Trace the three steps. This is deterministic automation.",
		},
		{
			seconds: 17,
			script:
				"Here are real application captures. Staff confirms the cancellation, then offers María's released slot to José, the waiting patient. The app uses the same fictional names as our story, with synthetic data. No real message is sent.",
			cue: "Read the two large step labels, not the screenshot paragraphs.",
		},
		{
			seconds: 18,
			script:
				"Ana sends the simulated offer. The patient previews the earlier appointment and explicitly confirms. Decline and help are also available. This confirmation is the key: the appointment changes only after acceptance. Everything shown runs in one browser session.",
			cue: "Point to Confirm preview. In the story, José makes this choice.",
		},
		{
			seconds: 17,
			script:
				"After acceptance, the schedule shows the new patient in the opening. The waitlist and activity history update too. For Dr. Rivera, the intended benefit is clarity about who is coming. This is a local simulation, not a live booking system.",
			cue: "The screenshot is filtered to the changed row. No clinical encounter is simulated.",
		},
		{
			seconds: 13,
			script:
				"Patients get a clear choice. Assistants get a visible workflow. Providers get an updated list. These are the benefits we designed for; actual time savings and access improvements still need pilot measurement.",
			cue: "Benefits are hypotheses, not measured impact claims.",
		},
		{
			seconds: 11,
			script:
				"No AI runs today. Future language assistance could clarify English and Spanish replies. That would add value beyond scheduling rules, without letting AI book or rank patients.",
			cue: "Keep working versus future explicit.",
		},
		{
			seconds: 12,
			script:
				"Explore the synthetic workflow, then help us validate it with care teams. Our next step is a measured, securely connected pilot. Smart Queue — Less Waiting. Better Care.",
			cue: "Finish on the closing line. No live demo is included in this timing.",
		},
	];
	const brief = {
		1: {
			seconds: 20,
			script:
				"María needs to cancel. Ana must coordinate the change. José wants an earlier appointment, and Dr. Rivera needs an accurate schedule. Smart Queue connects their workflow. These four people are fictional; the application also uses exclusively synthetic data.",
			cue: "Introduce the cast and value proposition.",
		},
		2: {
			seconds: 20,
			script:
				"A cancellation can leave unused capacity while another patient waits. Manual calls, disconnected updates, and unclear replies make it hard to close that gap. Smart Queue focuses on a practical healthcare challenge: connecting availability with a clear patient choice.",
			cue: "Describe the problem; avoid unsupported statistics.",
		},
		8: {
			seconds: 30,
			script:
				"In the working POC, staff confirms a cancellation and sends a simulated offer. The waiting patient previews the earlier appointment and explicitly confirms. Decline and help also work. This real screenshot shows José’s confirmation step. No account, message delivery, or real booking is involved. English and Spanish interfaces are available.",
			cue: "Point to the actual confirmation control.",
		},
		9: {
			seconds: 20,
			script:
				"Acceptance updates the appointment, waitlist, and activity history together. This actual schedule capture shows the changed row. Dr. Rivera’s intended benefit is clarity. State is local to this browser session; persistent services and real clinical use are future work.",
			cue: "Highlight the updated row, not simulated operational metrics.",
		},
		12: {
			seconds: 20,
			script:
				"No AI runs in the POC. Optional English and Spanish reply assistance is future work, alongside secure persistence and a measured pilot. Explore the synthetic workflow and help us validate it with care teams. Smart Queue — Less Waiting. Better Care.",
			cue: "Finish at about 1:50, leaving 10 seconds for transitions in a 2-minute recording.",
		},
	};
	const $ = (id) => document.getElementById(id);
	const slides = [...document.querySelectorAll(".slide")];
	let mode =
		new URLSearchParams(location.search).get("mode") === "submission"
			? "submission"
			: "story";
	let order = [],
		index = 0,
		started = null,
		elapsed = 0;
	const format = (seconds) =>
		`${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
	const currentNote = () =>
		mode === "story" ? narrative[order[index] - 1] : brief[order[index]];
	const total = () =>
		order.reduce(
			(sum, n) =>
				sum + (mode === "story" ? narrative[n - 1] : brief[n]).seconds,
			0,
		);
	function fit() {
		const bottom = document.querySelector(".controls").offsetHeight;
		const scale = Math.max(
			0.1,
			Math.min((innerWidth - 32) / 1600, (innerHeight - bottom - 40) / 900),
		);
		document.documentElement.style.setProperty("--scale", scale);
	}
	function render() {
		const active = order[index];
		slides.forEach((slide) => {
			slide.hidden = Number(slide.dataset.slide) !== active;
		});
		$("counter").textContent = `${index + 1} / ${order.length}`;
		$("canvas-count").textContent =
			`${String(index + 1).padStart(2, "0")} / ${order.length}`;
		$("previous").disabled = index === 0;
		$("next").disabled = index === order.length - 1;
		$("estimate").textContent = `Talk ${format(total())}`;
		const note = currentNote();
		$("note-title").textContent =
			`${index + 1}. ${$(`title-${active}`).textContent} · ${note.seconds}s`;
		$("note-script").textContent = note.script;
		$("note-cue").textContent = note.cue;
		document.title = `Smart Queue · ${index + 1}/${order.length} · ${mode === "story" ? "Story" : "Submission"}`;
		tick();
	}
	function navigate(direction) {
		index = Math.min(order.length - 1, Math.max(0, index + direction));
		render();
	}
	function resetTimer() {
		started = null;
		elapsed = 0;
		tick();
	}
	function setMode() {
		mode = $("mode").value;
		order =
			mode === "story"
				? slides.map((s) => Number(s.dataset.slide))
				: [1, 2, 8, 9, 12];
		index = 0;
		resetTimer();
		render();
		fit();
	}
	function tick() {
		const seconds =
			(elapsed + (started === null ? 0 : performance.now() - started)) / 1000;
		$("timer").textContent = format(seconds);
		$("timer-toggle").setAttribute(
			"aria-label",
			started === null ? "Start timer" : "Pause timer",
		);
		$("timer-toggle").firstChild.textContent = started === null ? "▶ " : "Ⅱ ";
		$("timer-toggle").classList.toggle("warning", seconds >= total());
		$("timer-toggle").classList.toggle(
			"over",
			seconds >= (mode === "story" ? 180 : 120),
		);
	}
	function toggleTimer() {
		if (started === null) started = performance.now();
		else {
			elapsed += performance.now() - started;
			started = null;
		}
		tick();
	}
	function toggleNotes(force) {
		$("notes").hidden =
			typeof force === "boolean" ? !force : !$("notes").hidden;
		$("notes-toggle").setAttribute("aria-expanded", String(!$("notes").hidden));
	}
	async function fullscreen() {
		try {
			if (document.fullscreenElement) await document.exitFullscreen();
			else if ($("theater").requestFullscreen)
				await $("theater").requestFullscreen();
			else throw new Error("unavailable");
		} catch {
			$("status").textContent =
				"Fullscreen is unavailable. Use your browser’s fullscreen command.";
		}
	}
	$("previous").addEventListener("click", () => navigate(-1));
	$("next").addEventListener("click", () => navigate(1));
	$("notes-toggle").addEventListener("click", () => toggleNotes());
	$("close-notes").addEventListener("click", () => {
		toggleNotes(false);
		$("notes-toggle").focus();
	});
	$("timer-toggle").addEventListener("click", toggleTimer);
	$("timer-reset").addEventListener("click", resetTimer);
	$("fullscreen").addEventListener("click", fullscreen);
	$("mode").value = mode;
	$("mode").addEventListener("change", setMode);
	addEventListener("resize", fit);
	document.addEventListener("fullscreenchange", fit);
	document.addEventListener("keydown", (event) => {
		if (
			event.altKey ||
			event.ctrlKey ||
			event.metaKey ||
			event.target.closest("select,input,textarea")
		)
			return;
		if (event.key === " " && event.target.closest("button")) return;
		if (["ArrowRight", "PageDown", " "].includes(event.key)) {
			event.preventDefault();
			navigate(1);
		} else if (["ArrowLeft", "PageUp"].includes(event.key)) {
			event.preventDefault();
			navigate(-1);
		} else if (event.key === "Home") {
			event.preventDefault();
			index = 0;
			render();
		} else if (event.key === "End") {
			event.preventDefault();
			index = order.length - 1;
			render();
		} else if (event.key.toLowerCase() === "n") toggleNotes();
		else if (event.key.toLowerCase() === "t") toggleTimer();
		else if (event.key.toLowerCase() === "r") resetTimer();
		else if (event.key.toLowerCase() === "f") fullscreen();
		else if (event.key === "Escape") toggleNotes(false);
	});
	setMode();
	setInterval(tick, 250);
})();
