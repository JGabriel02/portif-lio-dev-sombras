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


	// Abas pt/en do formulario de projeto. Sem JS todos os paineis ficam visiveis.
	function montaAbas() {
		document.querySelectorAll('[data-abas]').forEach(function (raiz) {
			var lista = raiz.querySelector('[role="tablist"]');
			var abas = Array.prototype.slice.call(raiz.querySelectorAll('[role="tab"]'));
			if (!lista || abas.length === 0) {
				return;
			}
			function painel(aba) {
				return document.getElementById(aba.getAttribute('aria-controls'));
			}
			function ativa(aba, foco) {
				abas.forEach(function (a) {
					var sel = a === aba;
					a.setAttribute('aria-selected', sel ? 'true' : 'false');
					a.tabIndex = sel ? 0 : -1;
					painel(a).hidden = !sel;
				});
				if (foco) {
					aba.focus();
				}
			}
			lista.hidden = false;
			raiz.classList.add('com-js');
			abas.forEach(function (aba, i) {
				aba.addEventListener('click', function () { ativa(aba, false); });
				aba.addEventListener('keydown', function (e) {
					var destino = null;
					if (e.key === 'ArrowRight') { destino = abas[(i + 1) % abas.length]; }
					else if (e.key === 'ArrowLeft') { destino = abas[(i - 1 + abas.length) % abas.length]; }
					else if (e.key === 'Home') { destino = abas[0]; }
					else if (e.key === 'End') { destino = abas[abas.length - 1]; }
					if (destino) {
						e.preventDefault();
						ativa(destino, true);
					}
				});
			});
			// abre a aba que tem campo com erro; senao, a primeira
			var inicial = abas[0];
			abas.forEach(function (aba) {
				if (painel(aba).querySelector('[aria-invalid="true"]')) {
					inicial = aba;
				}
			});
			ativa(inicial, false);
		});
	}
	document.addEventListener('DOMContentLoaded', montaAbas);

	document.addEventListener('DOMContentLoaded', montaGrafico);
	document.addEventListener('htmx:afterSwap', montaGrafico);
})();
