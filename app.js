// Funcionalidad para la página de Lectura Guiada
document.addEventListener('DOMContentLoaded', function() {
    // Configurar endpoint del chat: auto-prod Render o localhost en dev
    if (!window.CHAT_API_URL) {
        const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
        window.CHAT_API_URL = isLocal
            ? 'http://localhost:5050/api/chat'
            : 'https://ekggo.onrender.com/api/chat';
    }
    // Verificar si estamos en la página de lectura guiada
    const generarInformeBtn = document.getElementById('generarInforme');
    if (generarInformeBtn) {
        generarInformeBtn.addEventListener('click', generarInformeECG);
    }

    // Verificar si estamos en la página de comparación de patrones
    const tomarFotoBtn = document.getElementById('tomarFoto');
    if (tomarFotoBtn) {
        tomarFotoBtn.addEventListener('click', activarCamara);
        
        const ecgFile = document.getElementById('ecgFile');
        ecgFile.addEventListener('change', mostrarVistaPrevia);
        
        const subirImagenBtn = document.getElementById('subirImagen');
        subirImagenBtn.addEventListener('click', function() {
            document.getElementById('ecgFile').click();
        });
        
        const analizarECGBtn = document.getElementById('analizarECG');
        analizarECGBtn.addEventListener('click', analizarECG);
        
        const enviarChatGPTBtn = document.getElementById('enviarChatGPT');
        if (enviarChatGPTBtn) {
            enviarChatGPTBtn.addEventListener('click', enviarAChatGPT);
        }
        
        const buscarImagenesSimilaresBtn = document.getElementById('buscarImagenesSimilares');
        if (buscarImagenesSimilaresBtn) {
            buscarImagenesSimilaresBtn.addEventListener('click', buscarImagenesSimilares);
        }
        
        const guardarAnalisisPDFBtn = document.getElementById('guardarAnalisisPDF');
        if (guardarAnalisisPDFBtn) {
            guardarAnalisisPDFBtn.addEventListener('click', guardarAnalisisPDF);
        }
    }

    // Compatibilidad con la nueva versión de "Comparación de Patrones" (IDs V2)
    const ecgFileInput = document.getElementById('ecgFileInput');
    const btnCapturar = document.getElementById('btnCapturar');
    if (btnCapturar && ecgFileInput) {
        btnCapturar.addEventListener('click', capturarDesdeArchivoV2);

        const btnLimpiarCaptura = document.getElementById('btnLimpiarCaptura');
        if (btnLimpiarCaptura) btnLimpiarCaptura.addEventListener('click', limpiarCapturaV2);

        const btnAnalisisLocal = document.getElementById('btnAnalisisLocal');
        if (btnAnalisisLocal) btnAnalisisLocal.addEventListener('click', analizarECG_V2);

        const btnAnalisisChatGPT = document.getElementById('btnAnalisisChatGPT');
        if (btnAnalisisChatGPT) btnAnalisisChatGPT.addEventListener('click', enviarAChatGPT_V2);

        const btnAnalisisSimilares = document.getElementById('btnAnalisisSimilares');
        if (btnAnalisisSimilares) btnAnalisisSimilares.addEventListener('click', buscarImagenesSimilares_V2);

        const savePdfBtn = document.getElementById('savePdfBtn');
        if (savePdfBtn) savePdfBtn.addEventListener('click', guardarAnalisisPDF);
    }

    // Verificar si estamos en la página de copiar informe
    const copiarInformeBtn = document.getElementById('copiarInforme');
    if (copiarInformeBtn) {
        copiarInformeBtn.addEventListener('click', copiarInforme);
    }

    // Sospecha diagnóstica ECG
    const generarSospechaBtn = document.getElementById('generarSospecha');
    const copiarSospechaBtn = document.getElementById('copiarSospecha');
    if (generarSospechaBtn) generarSospechaBtn.addEventListener('click', generarSospechaECG);
    if (copiarSospechaBtn) copiarSospechaBtn.addEventListener('click', copiarSospecha);

    // Chat desplegable global (se muestra en todas las páginas)
    const toggle = document.createElement('button');
    toggle.className = 'chat-widget-toggle';
    toggle.type = 'button';
    toggle.setAttribute('aria-label', 'Abrir Chat EKG-LA');
    toggle.textContent = 'Chat EKG-LA';

    const panel = document.createElement('div');
    panel.className = 'chat-widget-panel';
    const iframe = document.createElement('iframe');
    iframe.src = 'chat.html';
    iframe.title = 'Chat EKG-LA';
    panel.appendChild(iframe);

    document.body.appendChild(toggle);
    document.body.appendChild(panel);
    toggle.addEventListener('click', () => {
        panel.classList.toggle('open');
    });

    // Escucha mensajes desde el iframe del chat para minimizar/expandir panel
    window.addEventListener('message', (e) => {
        const data = e.data || {};
        if (data.type === 'chat:minimize') {
            panel.classList.remove('open');
        } else if (data.type === 'chat:expand') {
            panel.classList.add('open');
            // Se puede ajustar tamaño si fuese necesario
            // panel.style.maxWidth = '480px';
        } else if (data.type === 'chat:close') {
            panel.classList.remove('open');
        }
    });
});

// Función para generar el informe ECG
function generarInformeECG() {
    const bienTomado = document.getElementById('bienTomado').checked ? 'bien tomado' : 'con limitaciones técnicas';
    const ritmo = document.getElementById('ritmo').value || '';
    const frecuencia = document.getElementById('frecuencia').value || '';
    const eje = document.getElementById('eje').value || '';
    const pr = document.getElementById('pr').value || '';
    const ondaP = document.getElementById('ondaP').value || '';
    const qrs = document.getElementById('qrs').value || '';
    const st = document.getElementById('st').value || '';
    const ondaT = document.getElementById('ondaT').value || '';
    const ondaTLeads = Array.from(document.querySelectorAll('.lead-checkbox'))
        .filter(cb => cb.checked)
        .map(cb => cb.id.replace('lead_','').toUpperCase());
    const qt = document.getElementById('qt').value || '';
    const alteraciones = '';

    // Informe narrativo (tono clínico)
    const partes = [];
    partes.push(`Electrocardiograma ${bienTomado}.`);
    if (ritmo) partes.push(`Ritmo ${ritmo.toLowerCase()}.`);
    if (frecuencia) partes.push(`Frecuencia ${frecuencia} lpm.`);
    if (eje) partes.push(`Eje ${eje.toLowerCase()}.`);
    if (pr) partes.push(`Intervalo PR ${pr} ms.`);
    if (qrs) partes.push(`Complejo QRS ${qrs} ms.`);
    // Prioridad excluyente entre ST y T en el informe
    const stLower = (st || '').toLowerCase();
    const stElevadoR = /elev/i.test(stLower);
    const stDescendidoR = /(desc|deprim)/i.test(stLower);
    const stAlterado = stElevadoR || stDescendidoR;
    const tLower = (ondaT || '').toLowerCase();
    const tAlterada = !!ondaT && !/normal/i.test(ondaT);

    if (st) {
        if (stAlterado) {
            if (ondaTLeads && ondaTLeads.length) {
                partes.push(`Segmento ST ${stLower} en derivaciones ${ondaTLeads.join(', ')}.`);
            } else {
                partes.push(`Segmento ST ${stLower}.`);
            }
        } else {
            // ST isoeléctrico u otro: consignar sin derivaciones
            partes.push(`Segmento ST ${stLower}.`);
        }
    }
    // Solo se consigna Onda T con derivaciones si ST no está alterado
    if (!stAlterado && ondaT) {
        if (tAlterada && ondaTLeads && ondaTLeads.length) {
            partes.push(`Onda T ${tLower} en derivaciones ${ondaTLeads.join(', ')}.`);
        } else {
            partes.push(`Onda T ${tLower}.`);
        }
    }
    if (qt) partes.push(`Intervalo QT: ${qt.toLowerCase()}.`);
    if (ondaP) partes.push(`Onda P: ${ondaP}.`);
    // Campo de alteraciones adicionales retirado: no se agrega al informe

    const informeNarrativo = partes.join(' ');
    const informeEl = document.getElementById('informeECG');
    informeEl.textContent = informeNarrativo;

    // Generar automáticamente la sospecha al crear el informe
    generarSospechaECG();
}

// Función para copiar el informe al portapapeles
function copiarInforme() {
    const informeTexto = document.getElementById('informeECG').textContent;
    navigator.clipboard.writeText(informeTexto)
        .then(() => {
            alert('Informe copiado al portapapeles');
        })
        .catch(err => {
            console.error('Error al copiar: ', err);
            alert('No se pudo copiar el informe');
        });
}

// Lógica rule-based para sospecha diagnóstica ECG (alineada al esquema proporcionado)
function generarSospechaECG() {
    const ritmo = (document.getElementById('ritmo')?.value || '').toLowerCase();
    const frecuencia = parseFloat(document.getElementById('frecuencia')?.value);
    const eje = (document.getElementById('eje')?.value || '').toLowerCase();
    const pr = parseFloat(document.getElementById('pr')?.value);
    const qrs = parseFloat(document.getElementById('qrs')?.value);
    const stText = (document.getElementById('st')?.value || '').toLowerCase();
    const ondaTText = (document.getElementById('ondaT')?.value || '').toLowerCase();
    const leadsSel = Array.from(document.querySelectorAll('.lead-checkbox'))
        .filter(cb => cb.checked)
        .map(cb => cb.id.replace('lead_','').toUpperCase());
    const qt = parseFloat(document.getElementById('qt')?.value);
    const otras = '';
    const has = (id) => !!document.getElementById(id)?.checked;

    // Normalizar palabras clave
    const stElevado = /elev/i.test(stText);
    const stDescendido = /(desc|deprim)/i.test(stText);
    const tInvertida = /invertid/i.test(ondaTText);
    const tPicuda = /(picud|punta|aguda)/i.test(ondaTText);
    const tAplanada = /(aplan|plana)/i.test(ondaTText);

    // Motor de puntuación para diferenciales
    const picks = [];
    const addPick = (name, score, reason) => picks.push({ name, score, reason });
    let comentario = '';

    // Territorios confirmados SOLO si se marcan TODAS sus derivaciones
    const territoryMap = {
        'inferior': ['DII', 'DIII', 'AVF'],
        'lateral alta': ['DI', 'AVL'],
        'lateral baja': ['V5', 'V6'],
        'anterior': ['V3', 'V4'],
        'septal': ['V1', 'V2']
    };
    const territoriesConfirmed = [];
    const territoryConfirmedDetails = [];
    Object.entries(territoryMap).forEach(([terr, leads]) => {
        const allPresent = leads.every(l => leadsSel.includes(l));
        if (allPresent) {
            territoriesConfirmed.push(terr);
            territoryConfirmedDetails.push(`${terr} (${leads.join(', ')})`);
        }
    });

    // Isquemia/lesión
    if (stElevado) {
        if (territoriesConfirmed.length) territoriesConfirmed.forEach(t => addPick('Infarto con elevación del ST (STEMI)', 5, `ST elevado en territorio ${t} (selección completa)`));
        else addPick('Infarto con elevación del ST (STEMI)', 5, 'Elevación del ST');
    }
    if (stDescendido) {
        if (territoriesConfirmed.length) territoriesConfirmed.forEach(t => addPick('Isquemia subendocárdica / NSTEMI', 3, `ST descendido en territorio ${t} (selección completa)`));
        else addPick('Isquemia subendocárdica / NSTEMI', 3, 'Descenso del ST');
    }
    if (tInvertida) {
        if (territoriesConfirmed.length) territoriesConfirmed.forEach(t => addPick('Isquemia subendocárdica / NSTEMI', 3, `T invertida en territorio ${t} (selección completa)`));
        else addPick('Isquemia subendocárdica / NSTEMI', 3, 'T invertida');
    }

    // Arritmias
    if (ritmo.includes('no sinusal') && !isNaN(frecuencia) && frecuencia > 150 && !isNaN(qrs) && qrs < 120) {
        addPick('Taquicardia supraventricular (TSV) probable', 4, 'No sinusal, FC >150, QRS estrecho');
    }
    // TV heuristic: QRS muy ancho + FC elevada + no sinusal
    if (!isNaN(qrs) && qrs >= 140 && (!isNaN(frecuencia) && frecuencia >= 120) && ritmo.includes('no sinusal')) {
        addPick('Taquicardia ventricular (TV) probable', 5, 'QRS ≥140 ms, FC ≥120 lpm, no sinusal');
    }
    if (ritmo.includes('sinusal') && !isNaN(frecuencia) && frecuencia < 60) {
        addPick('Bradicardia sinusal', 2, 'Sinusal con FC <60 lpm');
    }

    // Bloqueos
    if (!isNaN(pr) && pr > 200) addPick('Bloqueo AV de primer grado', 3, 'PR >200 ms');
    if (!isNaN(qrs) && qrs >= 120 && !stElevado) {
        if (eje.includes('izquierda')) addPick('Bloqueo de rama izquierda (BRI) probable', 3, 'QRS ancho con eje izquierdo');
        else if (eje.includes('derecha')) addPick('Bloqueo de rama derecha (BRD) probable', 3, 'QRS ancho con eje derecho');
        else addPick('Bloqueo de rama (QRS ≥120 ms)', 2, 'QRS ancho');
    }

    // Electrolitos
    if (tPicuda) addPick('Hiperkalemia probable', 4, 'T picudas');
    if (!isNaN(pr) && pr > 200) addPick('Hiperkalemia probable', 1, 'PR prolongado');
    if (!isNaN(qrs) && qrs >= 120) addPick('Hiperkalemia probable', 1, 'QRS ancho');
    if (tAplanada) addPick('Hipokalemia probable', 3, 'T aplanada');
    if (stDescendido) addPick('Hipokalemia probable', 1, 'ST descendido');
    // Pericarditis: ST difuso y/o PR deprimido
    if (has('crit_st_difuso')) addPick('Pericarditis aguda probable', 4, 'ST elevado difuso');
    if (has('crit_pr_deprimido')) addPick('Pericarditis aguda probable', 3, 'PR deprimido');
    // Onda U por checkbox
    if (has('crit_onda_u')) addPick('Hipokalemia probable', 3, 'Onda U');

    // QT por selección (lista desplegable)
    const qtSelSos = (document.getElementById('qt')?.value || '').toLowerCase();
    if (/prolong/.test(qtSelSos)) addPick('QT prolongado (valorar QTc y riesgo de torsades)', 3, 'QT prolongado');
    if (/cort/.test(qtSelSos)) addPick('QT corto (valorar causas y electrolitos)', 2, 'QT corto');

    // WPW y AV blocks por checkboxes
    if (has('crit_pr_corto') || has('crit_onda_delta')) addPick('Preexcitación (WPW) probable', 4, 'PR corto/onda delta');
    if (has('crit_pr_progresivo')) addPick('AV 2° Mobitz I (Wenckebach) probable', 4, 'PR progresivo con P no conducida');
    if (has('crit_pr_constante')) addPick('AV 2° Mobitz II probable', 4, 'PR constante con P no conducida');
    if (has('crit_disociacion_av')) addPick('Bloqueo AV completo (3er grado)', 5, 'Disociación AV');

    // Checkboxes opcionales (sumar puntuación y razones)
    if (has('crit_rsr_v1')) addPick('Bloqueo de rama derecha (BRD) probable', 4, "rSR' en V1");
    if (has('crit_s_ancha_i_v6')) addPick('Bloqueo de rama derecha (BRD) probable', 2, 'S ancha en I/V6');
    if (has('crit_r_empastada_v5_v6')) addPick('Bloqueo de rama izquierda (BRI) probable', 4, 'R empastada en V5–V6');
    if (has('crit_sin_q_i_v6')) addPick('Bloqueo de rama izquierda (BRI) probable', 3, 'Sin q en I/V6');
    if (has('crit_notch_75_i')) addPick('Bloqueo de rama izquierda (BRI) probable', 3, 'Notch >75 ms en I');
    if (has('crit_v1_qs_rs')) addPick('Bloqueo de rama derecha (BRD) probable', 2, 'V1 QS/rS');
    if (has('crit_v6_r_ancha')) addPick('Bloqueo de rama izquierda (BRI) probable', 2, 'V6 R alta ancha');
    if (has('crit_qrs_ancho')) addPick('Bloqueo de rama (QRS ≥120 ms)', 2, 'QRS ancho');
    if (has('crit_disociacion_av')) addPick('Bloqueo AV completo (3er grado)', 5, 'Disociación AV');
    if (has('crit_pr_progresivo')) addPick('AV 2° Mobitz I (Wenckebach) probable', 4, 'PR progresivo con P no conducida');
    if (has('crit_pr_constante')) addPick('AV 2° Mobitz II probable', 4, 'PR constante con P no conducida');
    if (has('crit_capturas_ventriculares')) addPick('Taquicardia ventricular (TV) probable', 4, 'Capturas ventriculares');
    if (has('crit_fusion')) addPick('Taquicardia ventricular (TV) probable', 4, 'Latidos de fusión');
    if (has('crit_concordancia_precordial')) addPick('Taquicardia ventricular (TV) probable', 3, 'Concordancia precordial');
    if (has('crit_brugada')) addPick('Síndrome de Brugada (patrón tipo 1/2)', 3, 'Elevación ST V1–V3');
    if (has('crit_wellens')) addPick('Signo de Wellens (estenosis DA)', 3, 'T negativa profunda V2–V3');
    if (has('crit_st_dep_global')) addPick('Isquemia subendocárdica / NSTEMI', 3, 'ST descendido global');
    if (has('crit_hvi')) addPick('Hipertrofia ventricular izquierda (HVI)', 2, 'Voltaje alto (Sokolow-Lyon)');
    if (has('crit_onda_delta')) addPick('Preexcitación (WPW) probable', 3, 'Onda delta');
    if (has('crit_st_concordante_bri')) addPick('Infarto con elevación del ST (STEMI)', 5, 'ST concordante en BRI');
    if (has('crit_st_discordante_bri')) addPick('Infarto con elevación del ST (STEMI)', 4, 'ST discordante excesivo en BRI');
    if (has('crit_qr_v1_qs_v1v2')) addPick('Infarto anteroseptal probable', 3, 'qR en V1 o QS en V1–V2');
    if (has('crit_onda_u')) addPick('Hipokalemia probable', 3, 'Onda U');
    if (has('crit_t_picuda')) addPick('Hiperkalemia probable', 4, 'T picuda');
    if (has('crit_qtc_prolongado')) addPick('QT prolongado (valorar QTc y riesgo de torsades)', 3, 'QTc prolongado');

    // Territorios (añadir al comentario)
    // Añadir criterio territorial explícito basado en derivaciones
    if (territoryConfirmedDetails.length) {
        comentario += ' Territorios confirmados por derivaciones: ' + territoryConfirmedDetails.join(', ') + '.';
    }

    // Mapeo morfológico desde "alteraciones" a criterios (Comparación de Patrones)
    // Texto libre retirado: la sospecha se nutre de variables guiadas y criterios morfológicos

    // Selección top 2 por puntuación
    const byScore = {};
    picks.forEach(p => {
        byScore[p.name] = (byScore[p.name] || 0) + p.score;
    });
    const sorted = Object.entries(byScore).sort((a,b) => b[1]-a[1]).map(([name]) => name);
    const top = (sorted.length ? sorted.slice(0, 2) : ['ECG sin hallazgos concluyentes']);

    // Correlación clínica solo una vez al final
    const fraseCorrelacion = 'Correlacionar con historia clínica.';
    if (!/correlacionar con historia clínica\.?/i.test(comentario)) comentario = (comentario ? comentario.trim() + ' ' : '') + fraseCorrelacion;
    else comentario = comentario.replace(/(correlacionar con historia clínica\.?)(.*)$/i, fraseCorrelacion);

    const resultado = { diagnostico_sugerido: top.join('; '), comentario };

    const cont = document.getElementById('resultadoSospecha');
    if (cont) {
        cont.classList.remove('d-none', 'alert-danger');
        cont.classList.add('alert-info');
        cont.innerHTML = '<strong>Diagnóstico sugerido:</strong> ' + resultado.diagnostico_sugerido + '<br><strong>Comentario:</strong> ' + resultado.comentario;
    }
    const critEl = document.getElementById('criteriosDetectados');
    if (critEl) {
        const reasons = Array.from(new Set(picks.map(p => p.reason).filter(Boolean)));
        if (reasons.length) {
            critEl.classList.remove('d-none');
            critEl.textContent = 'Criterios detectados: ' + reasons.join(', ');
        } else {
            critEl.classList.add('d-none');
            critEl.textContent = '';
        }
    }
}

function copiarSospecha() {
    const el = document.getElementById('resultadoSospecha');
    const text = el ? el.textContent : '';
    if (!text) return;
    navigator.clipboard.writeText(text)
        .then(() => alert('Sospecha copiada al portapapeles'))
        .catch(() => alert('No se pudo copiar la sospecha'));
}

// Función para activar la cámara
function activarCamara() {
    // Verificar si el navegador soporta la API de MediaDevices
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Tu navegador no soporta la captura de imágenes. Por favor, sube una imagen manualmente.');
        return;
    }

    // Crear elementos para la cámara si no existen
    let videoElement = document.getElementById('camaraVideo');
    if (!videoElement) {
        const previewContainer = document.getElementById('previewContainer');
        previewContainer.classList.remove('d-none');
        
        // Crear elemento de video
        videoElement = document.createElement('video');
        videoElement.id = 'camaraVideo';
        videoElement.autoplay = true;
        videoElement.classList.add('img-fluid', 'mb-2');
        
        // Crear botón para capturar
        const captureBtn = document.createElement('button');
        captureBtn.textContent = 'Capturar';
        captureBtn.classList.add('btn', 'btn-success', 'mb-3');
        captureBtn.id = 'captureBtn';
        
        // Agregar elementos al contenedor
        previewContainer.innerHTML = '';
        previewContainer.appendChild(videoElement);
        previewContainer.appendChild(captureBtn);
        
        // Agregar evento al botón de captura
        captureBtn.addEventListener('click', capturarImagen);
    }

    // Solicitar acceso a la cámara
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            videoElement.srcObject = stream;
        })
        .catch(error => {
            console.error('Error al acceder a la cámara: ', error);
            alert('No se pudo acceder a la cámara. Por favor, sube una imagen manualmente.');
        });
}

// Función para capturar imagen de la cámara
function capturarImagen() {
    const videoElement = document.getElementById('camaraVideo');
    const previewContainer = document.getElementById('previewContainer');
    
    // Crear un canvas para capturar la imagen
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    
    // Convertir a imagen
    const imageDataURL = canvas.toDataURL('image/png');
    
    // Detener la transmisión de video
    const stream = videoElement.srcObject;
    const tracks = stream.getTracks();
    tracks.forEach(track => track.stop());
    
    // Mostrar la imagen capturada
    previewContainer.innerHTML = '';
    const imgElement = document.createElement('img');
    imgElement.id = 'ecgPreview';
    imgElement.src = imageDataURL;
    imgElement.classList.add('img-fluid', 'border');
    imgElement.alt = 'ECG capturado';
    previewContainer.appendChild(imgElement);
    
    // Habilitar todos los botones de análisis
    document.getElementById('analizarECG').disabled = false;
    document.getElementById('enviarChatGPT').disabled = false;
    document.getElementById('buscarImagenesSimilares').disabled = false;
}

// Función para mostrar vista previa de imagen subida
function mostrarVistaPrevia(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const previewContainer = document.getElementById('previewContainer');
            previewContainer.classList.remove('d-none');
            previewContainer.innerHTML = '';
            
            const imgElement = document.createElement('img');
            imgElement.id = 'ecgPreview';
            imgElement.src = e.target.result;
            imgElement.classList.add('img-fluid', 'border');
            imgElement.alt = 'ECG subido';
            previewContainer.appendChild(imgElement);
            
            // Habilitar todos los botones de análisis
            document.getElementById('analizarECG').disabled = false;
            document.getElementById('enviarChatGPT').disabled = false;
            document.getElementById('buscarImagenesSimilares').disabled = false;
        };
        reader.readAsDataURL(file);
    }
}

// Función para analizar el ECG
function analizarECG() {
    // En una aplicación real, aquí se enviaría la imagen a un servidor para análisis
    // Para esta demo, mostraremos resultados simulados
    
    document.getElementById('resultadoAnalisis').classList.remove('d-none');
    document.getElementById('chatGPTAnalisis').classList.add('d-none');
    document.getElementById('imagenesEncontradas').classList.add('d-none');
    
    // Simular carga
    const listaPatrones = document.getElementById('listaPatrones');
    listaPatrones.innerHTML = '<li>Analizando imagen...</li>';
    
    // Después de 2 segundos, mostrar resultados simulados
    setTimeout(() => {
        listaPatrones.innerHTML = `
            <li><strong>Alta probabilidad (85%):</strong> Ritmo sinusal normal</li>
            <li><strong>Probabilidad media (45%):</strong> Posible hipertrofia ventricular izquierda</li>
            <li><strong>Baja probabilidad (25%):</strong> Alteraciones inespecíficas de la repolarización</li>
        `;
    }, 2000);
}

// Función para enviar la imagen a ChatGPT para análisis
function enviarAChatGPT() {
    // Mostrar el contenedor de análisis de ChatGPT
    document.getElementById('chatGPTAnalisis').classList.remove('d-none');
    document.getElementById('resultadoAnalisis').classList.add('d-none');
    document.getElementById('imagenesEncontradas').classList.add('d-none');
    
    // En una aplicación real, aquí se enviaría la imagen a la API de ChatGPT
    // Para esta demo, mostraremos resultados simulados
    
    // Simular carga
    const chatGPTRespuesta = document.getElementById('chatGPTRespuesta');
    chatGPTRespuesta.innerHTML = `
        <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Cargando...</span>
        </div>
        <p>Consultando a ChatGPT...</p>
    `;
    
    // Después de 3 segundos, mostrar resultados simulados
    setTimeout(() => {
        const respuestaSimulada = `
            <h5>Análisis del ECG:</h5>
            <p>Basado en la imagen proporcionada, este ECG muestra un <strong>ritmo sinusal normal</strong> con una frecuencia cardíaca de aproximadamente 75 latidos por minuto.</p>
            
            <h5>Características observadas:</h5>
            <ul>
                <li>Ritmo regular con ondas P presentes antes de cada complejo QRS</li>
                <li>Intervalo PR normal (aproximadamente 160 ms)</li>
                <li>Duración del QRS normal (aproximadamente 90 ms)</li>
                <li>No hay elevación o depresión significativa del segmento ST</li>
                <li>Ondas T de morfología normal</li>
                <li>No hay signos de hipertrofia ventricular</li>
            </ul>
            
            <h5>Interpretación:</h5>
            <p>Este ECG se considera dentro de los límites normales sin evidencia de patología cardíaca significativa. Recomendaría correlacionar estos hallazgos con la historia clínica y el examen físico del paciente.</p>
            
            <button type="button" class="btn btn-primary mt-3" data-bs-toggle="modal" data-bs-target="#chatGPTModal">
                Ver análisis completo
            </button>
        `;
        
        chatGPTRespuesta.innerHTML = respuestaSimulada;
        
        // También actualizar el contenido del modal
        document.getElementById('chatGPTModalContent').innerHTML = respuestaSimulada + `
            <h5 class="mt-4">Diagnóstico diferencial:</h5>
            <ul>
                <li>ECG normal</li>
                <li>Variante normal</li>
                <li>Posibles cambios no específicos que requieren correlación clínica</li>
            </ul>
            
            <h5>Recomendaciones:</h5>
            <ul>
                <li>Si el paciente está asintomático y este es un ECG de rutina, no se requieren más estudios.</li>
                <li>Si el paciente presenta síntomas cardíacos, considerar evaluación adicional según la presentación clínica.</li>
                <li>Seguimiento regular según factores de riesgo cardiovascular del paciente.</li>
            </ul>
            
            <div class="alert alert-info mt-3">
                <strong>Nota:</strong> Este análisis es generado por IA y no sustituye la interpretación de un profesional médico calificado. Siempre consulte con un cardiólogo para la interpretación definitiva de un ECG.
            </div>
        `;
    }, 3000);
}

// Función para buscar imágenes similares
function buscarImagenesSimilares() {
    // Mostrar el contenedor de imágenes encontradas
    document.getElementById('imagenesEncontradas').classList.remove('d-none');
    document.getElementById('resultadoAnalisis').classList.add('d-none');
    document.getElementById('chatGPTAnalisis').classList.add('d-none');
    
    // En una aplicación real, aquí se enviaría la imagen a un servicio de búsqueda de imágenes
    // Para esta demo, mostraremos resultados simulados
    
    const galeriaImagenes = document.getElementById('galeriaImagenes');
    galeriaImagenes.innerHTML = `
        <div class="col-12 text-center mb-4">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Buscando imágenes similares...</span>
            </div>
            <p>Buscando imágenes similares en la web...</p>
        </div>
    `;
    
    // Después de 3 segundos, mostrar resultados simulados
    setTimeout(() => {
        galeriaImagenes.innerHTML = `
            <div class="col-md-4 mb-3">
                <div class="card">
                    <img src="https://litfl.com/wp-content/uploads/2018/08/normal-sinus-rhythm-ecg.jpg" class="card-img-top" alt="ECG similar 1">
                    <div class="card-body">
                        <h5 class="card-title">Ritmo sinusal normal</h5>
                        <p class="card-text">Coincidencia: 92%</p>
                        <a href="https://litfl.com/normal-sinus-rhythm-ecg-library/" class="btn btn-primary btn-sm" target="_blank">Ver fuente</a>
                    </div>
                </div>
            </div>
            <div class="col-md-4 mb-3">
                <div class="card">
                    <img src="https://litfl.com/wp-content/uploads/2018/08/ECG-Sinus-bradycardia.jpg" class="card-img-top" alt="ECG similar 2">
                    <div class="card-body">
                        <h5 class="card-title">Bradicardia sinusal</h5>
                        <p class="card-text">Coincidencia: 78%</p>
                        <a href="https://litfl.com/sinus-bradycardia-ecg-library/" class="btn btn-primary btn-sm" target="_blank">Ver fuente</a>
                    </div>
                </div>
            </div>
            <div class="col-md-4 mb-3">
                <div class="card">
                    <img src="https://litfl.com/wp-content/uploads/2018/08/ECG-Left-bundle-branch-block-LBBB.jpg" class="card-img-top" alt="ECG similar 3">
                    <div class="card-body">
                        <h5 class="card-title">Bloqueo de rama izquierda</h5>
                        <p class="card-text">Coincidencia: 65%</p>
                        <a href="https://litfl.com/left-bundle-branch-block-lbbb-ecg-library/" class="btn btn-primary btn-sm" target="_blank">Ver fuente</a>
                    </div>
                </div>
            </div>
            <div class="col-12">
                <div class="alert alert-warning">
                    <strong>Nota:</strong> Las imágenes mostradas son solo ejemplos y no representan un diagnóstico médico. Consulte siempre con un profesional de la salud para la interpretación correcta de un ECG.
                </div>
            </div>
        `;
    }, 3000);
}

// Función para guardar el análisis como PDF
function guardarAnalisisPDF() {
    // En una aplicación real, aquí se generaría un PDF con el análisis
    // Para esta demo, mostraremos un mensaje de simulación
    alert('Funcionalidad de guardar como PDF simulada. En una aplicación real, se generaría un PDF con el análisis completo.');
}

// Funciones V2 para la nueva versión de "Comparación de Patrones"
function capturarDesdeArchivoV2() {
    const fileInput = document.getElementById('ecgFileInput');
    const file = fileInput && fileInput.files[0];
    if (!file) {
        alert('Selecciona una imagen de ECG desde el selector.');
        return;
    }
    const reader = new FileReader();
    reader.onload = function(e) {
        const previewContainer = document.getElementById('vistaPrevia');
        if (!previewContainer) return;
        previewContainer.classList.remove('d-none');
        previewContainer.innerHTML = '';
        const imgElement = document.createElement('img');
        imgElement.id = 'ecgPreview';
        imgElement.src = e.target.result;
        imgElement.classList.add('img-fluid', 'border');
        imgElement.alt = 'ECG subido';
        previewContainer.appendChild(imgElement);
        ['btnAnalisisLocal', 'btnAnalisisChatGPT', 'btnAnalisisSimilares'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.disabled = false;
        });
    };
    reader.readAsDataURL(file);
}

function limpiarCapturaV2() {
    const previewContainer = document.getElementById('vistaPrevia');
    if (previewContainer) {
        previewContainer.classList.add('d-none');
        previewContainer.innerHTML = '';
    }
    ['btnAnalisisLocal', 'btnAnalisisChatGPT', 'btnAnalisisSimilares'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.disabled = true;
    });
    ['resultadoLocal', 'resultadoChatGPT', 'resultadoSimilares'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('d-none');
    });
}

function analizarECG_V2() {
    const resultadoLocal = document.getElementById('resultadoLocal');
    const resultadoChatGPT = document.getElementById('resultadoChatGPT');
    const resultadoSimilares = document.getElementById('resultadoSimilares');
    if (resultadoLocal) {
        resultadoLocal.classList.remove('d-none');
        resultadoLocal.innerHTML = '<div class="alert alert-secondary">Analizando imagen...</div>';
    }
    if (resultadoChatGPT) resultadoChatGPT.classList.add('d-none');
    if (resultadoSimilares) resultadoSimilares.classList.add('d-none');
    setTimeout(() => {
        if (resultadoLocal) {
            resultadoLocal.innerHTML = `
                <ul class="mb-0">
                    <li><strong>Alta probabilidad (85%):</strong> Ritmo sinusal normal</li>
                    <li><strong>Probabilidad media (45%):</strong> Posible hipertrofia ventricular izquierda</li>
                    <li><strong>Baja probabilidad (25%):</strong> Alteraciones inespecíficas de la repolarización</li>
                </ul>
            `;
        }
    }, 2000);
}

function enviarAChatGPT_V2() {
    const resultadoLocal = document.getElementById('resultadoLocal');
    const resultadoChatGPT = document.getElementById('resultadoChatGPT');
    const resultadoSimilares = document.getElementById('resultadoSimilares');
    if (resultadoChatGPT) {
        resultadoChatGPT.classList.remove('d-none');
        resultadoChatGPT.innerHTML = `
            <div class="text-center">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
                <p class="mt-2">Consultando a ChatGPT...</p>
            </div>
        `;
    }
    if (resultadoLocal) resultadoLocal.classList.add('d-none');
    if (resultadoSimilares) resultadoSimilares.classList.add('d-none');

    setTimeout(() => {
        const resumen = `
            <h5>Análisis del ECG:</h5>
            <p>Basado en la imagen proporcionada, este ECG muestra un <strong>ritmo sinusal normal</strong> con una frecuencia cardíaca de aproximadamente 75 latidos por minuto.</p>
            <h5>Características observadas:</h5>
            <ul>
                <li>Ondas P antes de cada QRS</li>
                <li>Intervalo PR normal (~160 ms)</li>
                <li>Duración del QRS normal (~90 ms)</li>
                <li>Sin cambios significativos del ST</li>
                <li>Ondas T de morfología normal</li>
            </ul>
            <h5>Interpretación:</h5>
            <p>ECG dentro de límites normales. Correlacionar con clínica.</p>
            <button type="button" class="btn btn-primary mt-3" data-bs-toggle="modal" data-bs-target="#chatGPTModal">Ver análisis completo</button>
        `;
        if (resultadoChatGPT) resultadoChatGPT.innerHTML = resumen;
        const modalBody = document.getElementById('chatGPTModalBody');
        if (modalBody) {
            modalBody.innerHTML = resumen + `
                <h5 class="mt-4">Diagnóstico diferencial:</h5>
                <ul>
                    <li>ECG normal</li>
                    <li>Variante normal</li>
                    <li>Cambios inespecíficos</li>
                </ul>
                <h5>Recomendaciones:</h5>
                <ul>
                    <li>Si es de rutina y asintomático, sin estudios adicionales.</li>
                    <li>Si hay síntomas, evaluar según presentación clínica.</li>
                    <li>Seguimiento según riesgos cardiovasculares.</li>
                </ul>
                <div class="alert alert-info mt-3">
                    <strong>Nota:</strong> Análisis generado por IA. No sustituye evaluación médica.
                </div>
            `;
        }
    }, 3000);
}

function buscarImagenesSimilares_V2() {
    const resultadoLocal = document.getElementById('resultadoLocal');
    const resultadoChatGPT = document.getElementById('resultadoChatGPT');
    const resultadoSimilares = document.getElementById('resultadoSimilares');
    if (resultadoSimilares) {
        resultadoSimilares.classList.remove('d-none');
        resultadoSimilares.innerHTML = `
            <div class="text-center">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Buscando imágenes similares...</span>
                </div>
                <p class="mt-2">Buscando patrones similares...</p>
            </div>
        `;
    }
    if (resultadoLocal) resultadoLocal.classList.add('d-none');
    if (resultadoChatGPT) resultadoChatGPT.classList.add('d-none');

    setTimeout(() => {
        if (resultadoSimilares) {
            resultadoSimilares.innerHTML = `
                <div class="alert alert-warning">
                    <strong>Resultados simulados:</strong>
                    <ul class="mb-0">
                        <li>Ritmo sinusal normal — coincidencia 92%</li>
                        <li>Bradicardia sinusal — coincidencia 78%</li>
                        <li>Bloqueo de rama izquierda — coincidencia 65%</li>
                    </ul>
                </div>
            `;
        }
    }, 3000);
}
// (bloque previo de territorios trasladado dentro de generarSospechaECG)