// PDF export logic for Focus Quest using jsPDF and jspdf-autotable.
(function () {
  // Color palette (A4 portrait, mm, warm academic palette)
  const PALETTE = {
    bg: [217, 207, 187],       // #d9cfbb
    ink: [31, 27, 22],         // #1f1b16
    olive: [107, 106, 61],     // #6b6a3d
    muted: [93, 87, 72],       // #5d5748
    rowLine: [185, 174, 149],  // #b9ae95
    zebra: [230, 222, 201],    // #e6dec9
    white: [255, 255, 255]
  };

  // Convert points to millimeters (1 pt = 25.4 / 72 mm)
  const pt2mm = pt => (pt * 25.4) / 72;

  // Helper to fill page background
  function paintBg(doc) {
    doc.setFillColor(...PALETTE.bg);
    doc.rect(0, 0, 210, 297, 'F');
  }

  // Draw thin olive frame inset 12 mm (used on pages 1 & 2)
  function drawCoverFrame(doc) {
    doc.setDrawColor(...PALETTE.olive);
    doc.setLineWidth(pt2mm(0.4));
    doc.rect(12, 12, 186, 273, 'S');
  }

  // Get current time formatted in IST
  function getISTDateTime() {
    const now = new Date();
    const datePart = new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'Asia/Kolkata'
    }).format(now);
    const timePart = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata'
    }).format(now).toLowerCase();
    return `${datePart}, ${timePart} IST`;
  }

  // Format short date (e.g. "1 Nov 2026")
  function formatShortDate(dStr) {
    if (!dStr) return '';
    const d = new Date(dStr + 'T00:00:00Z');
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  }

  // Format long date (e.g. "Sunday, 1 November 2026")
  function formatLongDate(dStr) {
    if (!dStr) return '';
    const d = new Date(dStr + 'T00:00:00Z');
    return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  }

  // Format challenge date window (e.g. "1 Nov to 6 Dec 2026")
  function formatChallengeWindow() {
    const s = formatShortDate(FQ.C.START).replace(/\s\d{4}$/, '');
    const e = formatShortDate(FQ.C.END);
    return `${s} to ${e}`;
  }

  // Create initialized jsPDF document with automatic background on every page
  function createDoc() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Automatically fill page background whenever a new page is added
    const origAddPage = doc.addPage.bind(doc);
    doc.addPage = function (...args) {
      const res = origAddPage(...args);
      paintBg(doc);
      return res;
    };

    // Paint first page background
    paintBg(doc);
    return doc;
  }

  // Render Page 1: Cover
  function renderCover(doc, opts) {
    // opts: { isDaily, titleLines, preparedFor, reportDateOrPeriod, reportDateOrPeriodSub }
    drawCoverFrame(doc);

    // Top left "FOCUS QUEST" 9 pt, letter-spaced, olive, bold
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...PALETTE.olive);
    doc.text('FOCUS QUEST', 24, 25, { charSpace: 1.8 });

    // Left aligned around 34% page height: title in times bold 44 pt, two lines
    doc.setFont('times', 'bold');
    doc.setFontSize(44);
    doc.setTextColor(...PALETTE.ink);
    doc.text(opts.titleLines[0], 24, 102);
    doc.text(opts.titleLines[1], 24, 118);

    // Short olive rule (40 mm, 0.8 pt)
    doc.setDrawColor(...PALETTE.olive);
    doc.setLineWidth(pt2mm(0.8));
    doc.line(24, 126, 64, 126);

    // Helvetica 11 pt subtitle "What was studied, how long, and how it scored."
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(...PALETTE.muted);
    doc.text('What was studied, how long, and how it scored.', 24, 134);

    // Lower left: small olive caps "PREPARED FOR"
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...PALETTE.olive);
    doc.text('PREPARED FOR', 24, 192, { charSpace: 1.2 });

    // Player name in times bold 22 pt
    doc.setFont('times', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(...PALETTE.ink);
    doc.text(opts.preparedFor, 24, 203);

    // "REPORT DATE" or "PERIOD"
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...PALETTE.olive);
    doc.text(opts.isDaily ? 'REPORT DATE' : 'PERIOD', 24, 219, { charSpace: 1.2 });

    // Value plus "Day X of 36"
    doc.setFont('times', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...PALETTE.ink);
    doc.text(opts.reportDateOrPeriod, 24, 227);

    // Bottom: "Generated {date}, {time} IST" 8 pt muted
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...PALETTE.muted);
    doc.text(`Generated ${getISTDateTime()}`, 24, 270);
  }

  // Render Page 2: About This Report
  function renderAboutPage(doc, opts) {
    // opts: { preparedFor, account, reportType, reportDateOrPeriod, competingWith, stats }
    doc.addPage();
    drawCoverFrame(doc);

    // Heading: times bold 24 pt
    doc.setFont('times', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(...PALETTE.ink);
    doc.text('About this report', 24, 28);

    // Top hairline
    doc.setDrawColor(...PALETTE.rowLine);
    doc.setLineWidth(pt2mm(0.4));
    doc.line(24, 34, 186, 34);

    // Two-column key/value list with hairlines
    const rows = [
      ['Prepared for', opts.preparedFor],
      ['Account', opts.account],
      ['Report type', opts.reportType],
      [opts.isDaily ? 'Report date' : 'Period', opts.reportDateOrPeriod],
      ['Challenge window', formatChallengeWindow()],
      ['Competing with', opts.competingWith],
      ['Generated at', getISTDateTime()]
    ];

    let rowY = 34;
    const rowHeight = 11.5;

    rows.forEach(([k, v]) => {
      // Key
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(...PALETTE.muted);
      doc.text(k, 24, rowY + 7.5);

      // Value
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...PALETTE.ink);
      doc.text(String(v || '-'), 75, rowY + 7.5);

      // Bottom hairline
      rowY += rowHeight;
      doc.setDrawColor(...PALETTE.rowLine);
      doc.setLineWidth(pt2mm(0.4));
      doc.line(24, rowY, 186, rowY);
    });

    // At the bottom four stats (times bold 26 pt number over 8 pt label): Points, Current streak, Days logged, Missed days
    const statsList = [
      { num: `${opts.stats.tot}`, lab: 'Points' },
      { num: `${opts.stats.streak} d`, lab: 'Streak' },
      { num: `${opts.stats.logged}`, lab: 'Days logged' },
      { num: `${opts.stats.missed}`, lab: 'Missed' }
    ];

    const colX = [24, 65, 106, 147];
    statsList.forEach((st, idx) => {
      doc.setFont('times', 'bold');
      doc.setFontSize(26);
      doc.setTextColor(...PALETTE.ink);
      doc.text(st.num, colX[idx], 238);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...PALETTE.muted);
      doc.text(st.lab, colX[idx], 245);
    });
  }

  // Render footers on every page from page 2 in a final pass
  function renderFooters(doc, footerPlayer) {
    const totalPages = doc.internal.getNumberOfPages();
    for (let p = 2; p <= totalPages; p++) {
      doc.setPage(p);
      doc.saveGraphicsState && doc.saveGraphicsState();

      // For page 2 (which has the frame inset 12), line from 24 to 186
      // For page 3+ (content pages), line from 12 to 198
      const x1 = p === 2 ? 24 : 12;
      const x2 = p === 2 ? 186 : 198;
      const lineY = p === 2 ? 273 : 282;
      const textY = p === 2 ? 278 : 287;

      doc.setDrawColor(...PALETTE.olive);
      doc.setLineWidth(pt2mm(0.4));
      doc.line(x1, lineY, x2, lineY);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...PALETTE.muted);
      doc.text(`Focus Quest · ${footerPlayer} · Page ${p} of ${totalPages}`, x1, textY);

      doc.restoreGraphicsState && doc.restoreGraphicsState();
    }
  }

  // ---------------- FEATURE 1: DAILY REPORT ----------------
  async function downloadDailyReport(me, selectedDay, allLogs) {
    if (!me || !selectedDay) return;

    const myLogs = allLogs.filter(l => l.player === me.email);
    const log = myLogs.find(l => l.day === selectedDay) || {
      day: selectedDay,
      player: me.email,
      did_prep: false,
      coding: 0,
      apt_attempted: 0,
      apt_correct: 0,
      theory_min: 0,
      english_min: 0,
      notes: ''
    };

    const doc = createDoc();
    const otherPlayer = FQ.P.find(p => p.email !== me.email);
    const dayIdx = Math.max(1, FQ.ALLDAYS.indexOf(selectedDay) + 1);
    const totalDays = FQ.ALLDAYS.length;
    const longDate = formatLongDate(selectedDay);
    const shortDate = formatShortDate(selectedDay);

    // Page 1: Cover
    renderCover(doc, {
      isDaily: true,
      titleLines: ['Daily Study', 'Report'],
      preparedFor: me.name,
      reportDateOrPeriod: `${longDate} · Day ${dayIdx} of ${totalDays}`
    });

    // Page 2: About this report
    const myStats = FQ.calc(allLogs, me.email);
    renderAboutPage(doc, {
      isDaily: true,
      preparedFor: me.name,
      account: me.email,
      reportType: 'Daily study report',
      reportDateOrPeriod: shortDate,
      competingWith: otherPlayer ? otherPlayer.name : 'None',
      stats: myStats
    });

    // Page 3: Study Summary, Points, and What I Studied
    doc.addPage();

    // Date Heading
    doc.setFont('times', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(...PALETTE.ink);
    doc.text(longDate, 14, 25);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(...PALETTE.muted);
    doc.text(`Day ${dayIdx} of ${totalDays} · Daily Study Report`, 14, 31);

    // "Study summary" Table
    doc.setFont('times', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...PALETTE.ink);
    doc.text('Study summary', 14, 42);

    const isLight = FQ.mode(selectedDay) === 'light';
    const prepDoneText = isLight ? 'English-only day' : (log.did_prep ? 'Yes' : 'No');
    const aptAcc = log.apt_attempted > 0 ? Math.round((log.apt_correct / log.apt_attempted) * 100) : 0;
    const aptText = log.apt_attempted > 0 ? `${log.apt_correct}/${log.apt_attempted} (${aptAcc}%)` : '0/0 (0%)';

    doc.autoTable({
      startY: 46,
      head: [['Prep done', 'Coding questions solved', 'Aptitude (correct/attempted)', 'Theory + DS/ML minutes', 'English minutes']],
      body: [[
        prepDoneText,
        `${log.coding}`,
        aptText,
        `${log.theory_min} min`,
        `${log.english_min} min`
      ]],
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 8.5,
        textColor: PALETTE.ink,
        lineColor: PALETTE.rowLine,
        lineWidth: pt2mm(0.4),
        fillColor: PALETTE.bg
      },
      headStyles: {
        fillColor: PALETTE.olive,
        textColor: PALETTE.white,
        fontStyle: 'bold',
        fontSize: 8.5
      },
      margin: { left: 14, right: 14 }
    });

    // "Points" Table
    let curY = doc.lastAutoTable.finalY + 12;
    doc.setFont('times', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...PALETTE.ink);
    doc.text('Points', 14, curY);

    const fullMode = !isLight;
    const didPrep = fullMode && log.did_prep;
    const codingPts = didPrep ? Math.min(log.coding, 3) * 10 : 0;
    let aptPts = 0;
    if (didPrep) {
      aptPts = Math.min(log.apt_correct, 30);
      if (log.apt_attempted >= 20 && log.apt_correct / log.apt_attempted >= 0.7) {
        aptPts += 5;
      }
    }
    const theoryPts = didPrep ? Math.round(Math.min(log.theory_min, 60) / 60 * 15) : 0;
    const engPts = Math.round(Math.min(log.english_min, 30) / 30 * 20);
    const fullBonus = (didPrep && log.coding >= 2 && log.apt_attempted >= 20 && log.english_min >= 30) ? 10 : 0;

    // Calculate streak bonus up to selectedDay
    const logMap = {};
    myLogs.forEach(l => { logMap[l.day] = l; });
    let streakOnDay = 0;
    for (const d of FQ.ALLDAYS) {
      if (d > selectedDay) break;
      if (logMap[d]) {
        streakOnDay++;
      } else if (d < selectedDay) {
        streakOnDay = 0;
      }
    }
    const streakBonus = Math.min(streakOnDay * 2, 20);
    const basePts = FQ.dayPts(log);
    const totalPts = basePts + streakBonus;

    doc.autoTable({
      startY: curY + 4,
      head: [['Coding', 'Aptitude', 'Theory', 'English', 'Full-day bonus', 'Streak bonus', 'Total']],
      body: [[
        `${codingPts}`,
        `${aptPts}`,
        `${theoryPts}`,
        `${engPts}`,
        `${fullBonus}`,
        `${streakBonus}`,
        `${totalPts}`
      ]],
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 8.5,
        textColor: PALETTE.ink,
        lineColor: PALETTE.rowLine,
        lineWidth: pt2mm(0.4),
        fillColor: PALETTE.bg,
        halign: 'center'
      },
      headStyles: {
        fillColor: PALETTE.olive,
        textColor: PALETTE.white,
        fontStyle: 'bold',
        fontSize: 8.5,
        halign: 'center'
      },
      margin: { left: 14, right: 14 }
    });

    // "What I studied" Section
    curY = doc.lastAutoTable.finalY + 14;
    doc.setFont('times', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...PALETTE.ink);
    doc.text('What I studied', 14, curY);

    curY += 8;
    const notesStr = (log.notes || '').trim();

    if (!notesStr) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(12);
      doc.setTextColor(...PALETTE.muted);
      doc.text('No notes added.', 14, curY);
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(13);
      doc.setTextColor(...PALETTE.ink);

      const splitNotes = doc.splitTextToSize(notesStr, 182);
      const lineHeight = 6.2;

      for (let i = 0; i < splitNotes.length; i++) {
        if (curY > 270) {
          doc.addPage();
          curY = 25;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(13);
          doc.setTextColor(...PALETTE.ink);
        }
        doc.text(splitNotes[i], 14, curY);
        curY += lineHeight;
      }
    }

    // Footers
    renderFooters(doc, me.name);

    // Save PDF
    const safeName = me.name.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    doc.save(`focus-quest-daily-${safeName}-${selectedDay}.pdf`);
  }

  // ---------------- FEATURE 2: ALL LOGS PDF ----------------
  async function downloadAllLogsReport(me, playerFilter, allLogs) {
    const doc = createDoc();

    // Determine filtered logs and display name
    const filterPlayerObj = playerFilter ? FQ.P.find(p => p.email === playerFilter) : null;
    const preparedFor = filterPlayerObj
      ? filterPlayerObj.name
      : (FQ.P.map(p => p.name).join(' and ') || 'Sanket and Purva');
    const footerPlayer = filterPlayerObj ? filterPlayerObj.name : 'Everyone';

    const periodStr = `${formatShortDate(FQ.C.START)} to ${formatShortDate(FQ.C.END)}`;
    const totalDays = FQ.ALLDAYS.length;

    // Filter logs
    const filteredLogs = allLogs.filter(l => !playerFilter || l.player === playerFilter);
    const sortedLogs = [...filteredLogs].sort((a, b) => b.day.localeCompare(a.day) || a.player.localeCompare(b.player));

    // Page 1: Cover
    renderCover(doc, {
      isDaily: false,
      titleLines: ['Study Log', 'Report'],
      preparedFor,
      reportDateOrPeriod: `${periodStr} · ${totalDays} days`
    });

    // Page 2: About this report
    const targetEmail = filterPlayerObj ? filterPlayerObj.email : (me ? me.email : FQ.P[0].email);
    const targetStats = FQ.calc(allLogs, targetEmail);
    const otherPlayer = FQ.P.find(p => p.email !== targetEmail);

    renderAboutPage(doc, {
      isDaily: false,
      preparedFor,
      account: me ? me.email : targetEmail,
      reportType: 'Study log report',
      reportDateOrPeriod: periodStr,
      competingWith: otherPlayer ? otherPlayer.name : 'All players',
      stats: targetStats
    });

    // Page 3 onward: one autoTable
    doc.addPage();

    const nameMap = {};
    FQ.P.forEach(p => { nameMap[p.email] = p.name; });

    const tableRows = sortedLogs.map(l => {
      const pName = nameMap[l.player] || l.player;
      const isLight = FQ.mode(l.day) === 'light';
      const prepStr = isLight ? '-' : (l.did_prep ? 'Yes' : 'No');
      const aptStr = `${l.apt_correct}/${l.apt_attempted}`;
      const theoryStr = `${l.theory_min}m`;
      const engStr = `${l.english_min}m`;
      const pts = `${FQ.dayPts(l)}`;
      const notes = l.notes || '';
      return [l.day, pName, prepStr, l.coding, aptStr, theoryStr, engStr, pts, notes];
    });

    doc.autoTable({
      startY: 18,
      head: [['Date', 'Player', 'Prep', 'Coding', 'Aptitude', 'Theory min', 'English min', 'Points', 'Notes']],
      body: tableRows,
      theme: 'grid',
      showHead: 'everyPage',
      margin: { left: 12, right: 12, top: 18, bottom: 20 },
      styles: {
        font: 'helvetica',
        fontSize: 8,
        textColor: PALETTE.ink,
        lineColor: PALETTE.rowLine,
        lineWidth: pt2mm(0.3),
        fillColor: PALETTE.bg,
        cellPadding: 2
      },
      headStyles: {
        fillColor: PALETTE.olive,
        textColor: PALETTE.white,
        fontStyle: 'bold',
        fontSize: 8,
        lineColor: PALETTE.olive
      },
      alternateRowStyles: {
        fillColor: PALETTE.zebra
      },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 16 },
        2: { cellWidth: 12, halign: 'center' },
        3: { cellWidth: 14, halign: 'right' },
        4: { cellWidth: 18, halign: 'right' },
        5: { cellWidth: 18, halign: 'right' },
        6: { cellWidth: 18, halign: 'right' },
        7: { cellWidth: 14, halign: 'right', fontStyle: 'bold' },
        8: { cellWidth: 'auto' }
      }
    });

    // Footers
    renderFooters(doc, footerPlayer);

    // File name
    const todayStr = FQ.TODAY || new Date().toISOString().slice(0, 10);
    doc.save(`focus-quest-logs-${todayStr}.pdf`);
  }

  // Expose to window.FQ
  window.FQ = window.FQ || {};
  window.FQ.downloadDailyReport = downloadDailyReport;
  window.FQ.downloadAllLogsReport = downloadAllLogsReport;
})();
