(function () {
	'use strict';

	var grafico = null;

	// Deixa o htmx trocar o conteudo tambem quando o servidor responde 503 (banco fora).
	if (typeof htmx !== 'undefined') {
		htmx.config.responseHandling = [
			{ code: '204', swap: false },
			{ code: '503', swap: true, error: false },
			{ code: '[23]..', swap: true },
			{ code: '[45]..', swap: false, error: true },
			{ code: '...', swap: true }
		];
	}

	function montaGrafico() {
		var canvas = document.getElementById('grafico-visitas');
		if (grafico) {
			grafico.destroy();
			grafico = null;
		}
		if (!canvas || typeof Chart === 'undefined') {
			return;
		}
		var serie;
		try {
			serie = JSON.parse(canvas.getAttribute('data-serie') || '[]');
		} catch (e) {
			serie = [];
		}
		var css = getComputedStyle(document.documentElement);
		var cor = css.getPropertyValue('--accent').trim() || '#a77bff';
		var texto = css.getPropertyValue('--text-muted').trim() || '#9c8fb8';
		var linha = css.getPropertyValue('--line').trim() || '#3a2c57';
		grafico = new Chart(canvas, {
			type: 'line',
			data: {
				labels: serie.map(function (p) { return p.dia; }),
				datasets: [{
					label: 'Visitas',
					data: serie.map(function (p) { return p.visitas; }),
					borderColor: cor,
					backgroundColor: cor,
					tension: 0.25,
					pointRadius: 3
				}]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				animation: false,
				plugins: { legend: { display: false } },
				scales: {
					x: { ticks: { color: texto, maxTicksLimit: 8 }, grid: { color: linha } },
					y: { beginAtZero: true, ticks: { color: texto, precision: 0 }, grid: { color: linha } }
				}
			}
		});
	}

	document.addEventListener('DOMContentLoaded', montaGrafico);
	document.addEventListener('htmx:afterSwap', montaGrafico);
})();
