// biome-ignore lint/suspicious/noRedundantUseStrict: This is a classic browser script, not an ES module.
"use strict";
(() => {
	// Speaker notes live in SPEAKER_NOTES.md; the controls are prev/next, deck mode, and fullscreen only.
	const $ = (id) => document.getElementById(id);
	const slides = [...document.querySelectorAll(".slide")];
	let mode =
		new URLSearchParams(location.search).get("mode") === "submission"
			? "submission"
			: "story";
	let order = [],
		index = 0;
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
		document.title = `Smart Queue · ${index + 1}/${order.length} · ${mode === "story" ? "Story" : "Submission"}`;
	}
	function navigate(direction) {
		index = Math.min(order.length - 1, Math.max(0, index + direction));
		render();
	}
	function setMode() {
		mode = $("mode").value;
		order =
			mode === "story"
				? slides.map((s) => Number(s.dataset.slide))
				: [1, 2, 8, 9, 12];
		index = 0;
		render();
		fit();
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
		} else if (event.key.toLowerCase() === "f") fullscreen();
	});
	setMode();
})();
