/**
 * AETHERIA SKYWAYS - Luxury Flight Booking Web Application
 * Client-side State, Search Engine, Seat Selector & Boarding Pass Generator
 */

const app = (function () {
  // Global State
  const state = {
    currentStep: 1,
    tripType: 'one-way',
    currency: 'INR',
    currencyRates: {
      USD: { symbol: '$', rate: 1.0 },
      INR: { symbol: '₹', rate: 85.0 },
      EUR: { symbol: '€', rate: 0.92 },
      GBP: { symbol: '£', rate: 0.78 },
      AED: { symbol: 'AED ', rate: 3.67 },
      SGD: { symbol: 'S$', rate: 1.34 }
    },
    searchParams: {
      from: null,
      to: null,
      departureDate: null,
      returnDate: null,
      passengers: 1,
      preferredCabin: 'all',
      directOnly: false
    },
    flights: [],
    selectedFlight: null,
    selectedClass: 'business',
    selectedSeat: '4A',
    passenger: {
      title: 'Mr',
      fullName: '',
      mobile: '',
      email: '',
      passport: '',
      dob: '',
      meal: "Chef's Gourmet Selection",
      frequentFlyer: ''
    },
    bookingRecord: null
  };

  // Curated Global Airports Database
  const airports = [
    { code: 'HYD', city: 'Hyderabad', country: 'India', airport: 'Rajiv gandhi airport' },
    { code: 'DEL', city: 'New Delhi', country: 'India', airport: 'Indira Gandhi Intl' },
    { code: 'BLR', city: 'Bengaluru', country: 'India', airport: 'Kempegowda Intl' },
    { code: 'DXB', city: 'Dubai', country: 'United Arab Emirates', airport: 'Dubai International' },
    { code: 'LHR', city: 'London', country: 'United Kingdom', airport: 'Heathrow Airport' },
    { code: 'JFK', city: 'New York', country: 'United States', airport: 'John F. Kennedy Intl' },
    { code: 'SFO', city: 'San Francisco', country: 'United States', airport: 'San Francisco Intl' },
    { code: 'SIN', city: 'Singapore', country: 'Singapore', airport: 'Changi Airport' },
    { code: 'HND', city: 'Tokyo', country: 'Japan', airport: 'Haneda Airport' },
    { code: 'CDG', city: 'Paris', country: 'France', airport: 'Charles de Gaulle Airport' },
    { code: 'FRA', city: 'Frankfurt', country: 'Germany', airport: 'Frankfurt Airport' },
    { code: 'ZRH', city: 'Zurich', country: 'Switzerland', airport: 'Zurich Airport' },
    { code: 'DOH', city: 'Doha', country: 'Qatar', airport: 'Hamad International' },
    { code: 'SYD', city: 'Sydney', country: 'Australia', airport: 'Kingsford Smith Airport' },
    { code: 'BKK', city: 'Bangkok', country: 'Thailand', airport: 'Suvarnabhumi Airport' },
    { code: 'MEL', city: 'Melbourne', country: 'Australia', airport: 'Melbourne Airport' },
    { code: 'MUC', city: 'Munich', country: 'Germany', airport: 'Munich Airport' },
    { code: 'AMS', city: 'Amsterdam', country: 'Netherlands', airport: 'Schiphol Airport' },
  ];

  // Premier Airlines Fleet
  const airlines = [
    { name: 'Emirates', code: 'EK', logoText: 'EK', color: 'from-rose-600 to-red-700', rating: '5.0 ★ Skytrax' },
    { name: 'Qatar Airways', code: 'QR', logoText: 'QR', color: 'from-amber-700 to-rose-900', rating: '5.0 ★ Skytrax' },
    { name: 'Singapore Airlines', code: 'SQ', logoText: 'SQ', color: 'from-blue-600 to-indigo-900', rating: '5.0 ★ Skytrax' },
    { name: 'Lufthansa', code: 'LH', logoText: 'LH', color: 'from-amber-500 to-blue-900', rating: '4.8 ★ Skytrax' },
    { name: 'British Airways', code: 'BA', logoText: 'BA', color: 'from-blue-700 to-red-600', rating: '4.7 ★ Skytrax' },
    { name: 'Air France', code: 'AF', logoText: 'AF', color: 'from-sky-600 to-indigo-950', rating: '4.8 ★ Skytrax' },
    { name: 'indigo', code: '6E', logoText: '6E', color: 'from-indigo-600 to-blue-900', rating: '4.5 ★ Skytrax' }
  ];

  // Audio effects using Web Audio API (No external sound files required)
  function playAudioChime(type = 'click') {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'click') {
        osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1000, audioCtx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.08);
      } else if (type === 'success') {
        // Luxury golden triad chime
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, index) => {
          const o = audioCtx.createOscillator();
          const g = audioCtx.createGain();
          o.connect(g);
          g.connect(audioCtx.destination);
          o.frequency.setValueAtTime(freq, audioCtx.currentTime + index * 0.1);
          g.gain.setValueAtTime(0.06, audioCtx.currentTime + index * 0.1);
          g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + index * 0.1 + 0.4);
          o.start(audioCtx.currentTime + index * 0.1);
          o.stop(audioCtx.currentTime + index * 0.1 + 0.45);
        });
      }
    } catch (e) {
      // Audio context may be blocked by browser policy until interaction
    }
  }

  // Format money with active currency
  function formatPrice(usdAmount) {
    const cur = state.currencyRates[state.currency];
    const converted = Math.round(usdAmount * cur.rate);
    return `${cur.symbol}${converted.toLocaleString()}`;
  }

  // Set Currency
  function setCurrency(newCur) {
    if (state.currencyRates[newCur]) {
      state.currency = newCur;
      // Re-render appropriate view
      if (state.currentStep === 2) renderFlightResults();
      if (state.currentStep === 3) renderCabinPrices();
      if (state.currentStep === 4) updateFareSummary();
      playAudioChime('click');
    }
  }

  // Set Trip Type
  function setTripType(type) {
    state.tripType = type;
    const returnContainer = document.getElementById('return-date-container');
    const returnInput = document.getElementById('input-return');

    ['one-way', 'round-trip', 'multi-city'].forEach(t => {
      const btn = document.getElementById(`tab-${t}`);
      if (btn) {
        if (t === type) {
          btn.className = 'px-5 py-2 rounded-xl transition-all duration-300 text-gold-400 bg-gold-500/15 border border-gold-400/30 font-semibold shadow-sm';
        } else {
          btn.className = 'px-5 py-2 rounded-xl transition-all duration-300 text-slate-400 hover:text-white';
        }
      }
    });

    if (type === 'round-trip') {
      returnContainer.classList.remove('opacity-50', 'pointer-events-none');
      returnInput.setAttribute('required', 'true');
    } else {
      returnContainer.classList.add('opacity-50', 'pointer-events-none');
      returnInput.removeAttribute('required');
      returnInput.value = '';
    }
    playAudioChime('click');
  }

  // Show and filter airport suggestion menus
  function showAirportSuggestions(type) {
    const dropdown = document.getElementById(`suggestions-${type}`);
    const inputVal = document.getElementById(`input-${type}`).value.toLowerCase();
    filterAirportSuggestions(type, inputVal);
    dropdown.classList.remove('hidden');
  }

  function filterAirportSuggestions(type, query) {
    const dropdown = document.getElementById(`suggestions-${type}`);
    const q = (query || '').toLowerCase().trim();

    const matches = airports.filter(a =>
      a.city.toLowerCase().includes(q) ||
      a.code.toLowerCase().includes(q) ||
      a.country.toLowerCase().includes(q) ||
      a.airport.toLowerCase().includes(q)
    );

    if (matches.length === 0) {
      dropdown.innerHTML = `<div class="p-3 text-xs text-slate-500 font-mono text-center">No matching airport found</div>`;
      dropdown.classList.remove('hidden');
      return;
    }

    dropdown.innerHTML = matches.map(a => `
      <div onclick="app.selectAirport('${type}', '${a.code}')" class="airport-option flex items-center justify-between p-2.5 rounded-xl cursor-pointer hover:bg-white/5 transition-colors">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-midnight-950 border border-white/10 flex items-center justify-center font-mono font-bold text-xs text-gold-400">
            ${a.code}
          </div>
          <div>
            <div class="text-xs font-semibold text-white">${a.city}, ${a.country}</div>
            <div class="text-[11px] text-slate-400 truncate max-w-[220px]">${a.airport}</div>
          </div>
        </div>
        <span class="text-[10px] font-mono text-slate-500 uppercase">Select</span>
      </div>
    `).join('');

    dropdown.classList.remove('hidden');
  }

  function selectAirport(type, code) {
    const airport = airports.find(a => a.code === code);
    if (!airport) return;
    const input = document.getElementById(`input-${type}`);
    input.value = `${airport.city} (${airport.code}) - ${airport.airport}`;
    document.getElementById(`suggestions-${type}`).classList.add('hidden');
    playAudioChime('click');
  }

  function swapAirports() {
    const fromInput = document.getElementById('input-from');
    const toInput = document.getElementById('input-to');
    const temp = fromInput.value;
    fromInput.value = toInput.value;
    toInput.value = temp;
    playAudioChime('click');
  }

  function quickFill(fromCode, toCode) {
    selectAirport('from', fromCode);
    selectAirport('to', toCode);
  }

  // Parse code from input value
  function parseAirportCode(inputValue) {
    const match = inputValue.match(/\(([A-Z]{3})\)/);
    if (match) return match[1];
    const directMatch = inputValue.trim().toUpperCase();
    if (directMatch.length === 3) return directMatch;
    return 'BOM';
  }

  // Generate dynamic, realistic flights
  function generateFlights(originCode, destCode, departureDate) {
    const origin = airports.find(a => a.code === originCode) || airports[0];
    const dest = airports.find(a => a.code === destCode) || airports[4];

    // Aircraft types
    const aircrafts = ['Boeing 777-300ER', 'Airbus A380-800', 'Airbus A350-1000', 'Boeing 787-9 Dreamliner'];

    // Base travel duration estimation
    const isIntercontinental = origin.country !== dest.country;
    const baseHours = isIntercontinental ? Math.floor(Math.random() * 5) + 7 : Math.floor(Math.random() * 2) + 2;
    const baseMins = [10, 25, 40, 50][Math.floor(Math.random() * 4)];

    const times = [
      { dep: '02:30', arrMod: baseHours },
      { dep: '08:15', arrMod: baseHours },
      { dep: '13:45', arrMod: baseHours },
      { dep: '16:20', arrMod: baseHours + 1 },
      { dep: '21:00', arrMod: baseHours },
      { dep: '23:30', arrMod: baseHours + 2 }
    ];

    const generated = airlines.map((airline, idx) => {
      const timeSlot = times[idx % times.length];
      const depHour = parseInt(timeSlot.dep.split(':')[0]);
      const depMin = parseInt(timeSlot.dep.split(':')[1]);

      let arrHour = (depHour + timeSlot.arrMod) % 24;
      let arrMin = (depMin + baseMins) % 60;
      const isNextDay = depHour + timeSlot.arrMod >= 24;

      const formatTimeStr = (h, m) => {
        const period = h >= 12 ? 'PM' : 'AM';
        const displayH = h % 12 === 0 ? 12 : h % 12;
        return `${String(displayH).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
      };

      const depTimeFormatted = formatTimeStr(depHour, depMin);
      const arrTimeFormatted = formatTimeStr(arrHour, arrMin) + (isNextDay ? ' (+1)' : '');
      const durationFormatted = `${timeSlot.arrMod}h ${baseMins}m`;
      const isDirect = idx % 2 === 0 || idx === 0;

      // Base fare in USD
      const baseFare = 380 + (idx * 65) + (isDirect ? 70 : 0);

      return {
        id: `FL-${airline.code}-${100 + idx * 23}`,
        flightNumber: `${airline.code}-${500 + idx * 12}`,
        airline: airline.name,
        airlineCode: airline.code,
        aircraft: aircrafts[idx % aircrafts.length],
        origin: origin,
        destination: dest,
        departureTime: depTimeFormatted,
        arrivalTime: arrTimeFormatted,
        depHourNumber: depHour,
        duration: durationFormatted,
        durationMinutes: timeSlot.arrMod * 60 + baseMins,
        isDirect: isDirect,
        stopsText: isDirect ? 'Non-Stop Direct' : '1 Stop (45m Transit)',
        baseFareUsd: baseFare,
        rating: airline.rating,
        carbonOffset: '$50 included',
        terminal: `Terminal ${idx % 2 + 1}`,
        gate: `Gate ${['A', 'B', 'C'][idx % 3]}${10 + idx * 2}`
      };
    });

    return generated;
  }

  // Handle Flight Search Submission
  function handleSearchSubmit(event) {
    if (event) event.preventDefault();

    const fromVal = document.getElementById('input-from').value;
    const toVal = document.getElementById('input-to').value;
    const depDate = document.getElementById('input-departure').value;
    const passengers = parseInt(document.getElementById('search-passengers').value);
    const directOnly = document.getElementById('filter-direct-only').checked;

    if (!fromVal || !toVal || !depDate) {
      alert('Please select origin, destination, and departure date.');
      return;
    }

    const fromCode = parseAirportCode(fromVal);
    const toCode = parseAirportCode(toVal);

    if (fromCode === toCode) {
      alert('Origin and Destination cannot be the same airport.');
      return;
    }

    state.searchParams = {
      from: fromCode,
      to: toCode,
      departureDate: depDate,
      passengers: passengers,
      directOnly: directOnly
    };

    // Generate Flights
    let flightList = generateFlights(fromCode, toCode, depDate);
    if (directOnly) {
      flightList = flightList.filter(f => f.isDirect);
    }
    state.flights = flightList;

    // Switch View to Results
    goToStep(2);
    renderFlightResults();
    playAudioChime('click');
  }

  // Render Flight Cards on Results View
  function renderFlightResults() {
    const container = document.getElementById('flight-cards-container');
    const routeTitle = document.getElementById('results-route-title');
    const countBadge = document.getElementById('results-count-badge');
    const metaSubtitle = document.getElementById('results-meta-subtitle');

    const origin = airports.find(a => a.code === state.searchParams.from);
    const dest = airports.find(a => a.code === state.searchParams.to);

    routeTitle.innerText = `${origin.city} (${origin.code}) → ${dest.city} (${dest.code})`;
    countBadge.innerText = `${state.flights.length} Flights Available`;
    metaSubtitle.innerText = `${state.searchParams.departureDate} • ${state.searchParams.passengers} Passenger(s)`;

    if (state.flights.length === 0) {
      container.innerHTML = `
        <div class="glass-panel p-12 text-center rounded-3xl border border-white/10 space-y-4">
          <i data-lucide="plane-alert" class="w-12 h-12 text-gold-400 mx-auto"></i>
          <h3 class="text-xl font-display font-bold text-white">No Flights Found</h3>
          <p class="text-xs text-slate-400">Try adjusting your filters or turning off "Non-stop flights only".</p>
          <button onclick="app.backToSearch()" class="px-5 py-2.5 rounded-xl bg-gold-500 text-midnight-950 font-mono text-xs font-bold">Adjust Search</button>
        </div>
      `;
      lucide.createIcons();
      return;
    }

    container.innerHTML = state.flights.map(flight => {
      const priceEcon = formatPrice(flight.baseFareUsd);
      const priceBiz = formatPrice(Math.round(flight.baseFareUsd * 3.6));

      return `
        <div class="flight-card glass-panel rounded-3xl p-6 border border-white/10 hover:border-gold-400/50 hover:shadow-gold-glow transition-all duration-300 group">
          <div class="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            
            <!-- Airline Info (Col 3) -->
            <div class="md:col-span-3 flex items-center gap-3">
              <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-gold-400/20 to-amber-600/30 border border-gold-400/40 flex items-center justify-center font-mono font-bold text-gold-300 text-sm shadow-md">
                ${flight.airlineCode}
              </div>
              <div>
                <h4 class="font-display font-bold text-white text-base">${flight.airline}</h4>
                <div class="flex items-center gap-2 mt-0.5">
                  <span class="text-[11px] font-mono text-slate-400">${flight.flightNumber}</span>
                  <span class="text-[10px] text-gold-400 font-mono">${flight.rating}</span>
                </div>
                <div class="text-[10px] text-slate-500 font-mono mt-0.5">${flight.aircraft}</div>
              </div>
            </div>

            <!-- Route Flight Timeline (Col 6) -->
            <div class="md:col-span-6 flex items-center justify-between px-2 sm:px-6">
              
              <!-- Departure -->
              <div class="text-left">
                <div class="text-xl sm:text-2xl font-mono font-bold text-white">${flight.departureTime}</div>
                <div class="text-xs font-mono font-semibold text-gold-400 mt-0.5">${flight.origin.code}</div>
                <div class="text-[10px] text-slate-400 truncate max-w-[100px]">${flight.origin.city}</div>
              </div>

              <!-- Center Track -->
              <div class="flex-1 px-4 sm:px-8 text-center">
                <div class="text-[10px] font-mono text-slate-400 mb-1">${flight.duration}</div>
                <div class="relative flex items-center justify-center">
                  <div class="w-full border-t border-dashed border-white/20 group-hover:border-gold-400/50 transition-colors"></div>
                  <div class="absolute w-6 h-6 rounded-full bg-midnight-950 border border-gold-400/50 flex items-center justify-center text-gold-400 shadow-sm transition-transform group-hover:scale-110">
                    <i data-lucide="plane" class="w-3 h-3"></i>
                  </div>
                </div>
                <div class="text-[10px] font-mono mt-1 ${flight.isDirect ? 'text-emerald-400' : 'text-amber-400'}">${flight.stopsText}</div>
              </div>

              <!-- Arrival -->
              <div class="text-right">
                <div class="text-xl sm:text-2xl font-mono font-bold text-white">${flight.arrivalTime}</div>
                <div class="text-xs font-mono font-semibold text-gold-400 mt-0.5">${flight.destination.code}</div>
                <div class="text-[10px] text-slate-400 truncate max-w-[100px]">${flight.destination.city}</div>
              </div>

            </div>

            <!-- Pricing & Action Button (Col 3) -->
            <div class="md:col-span-3 flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6 gap-3">
              <div class="text-left md:text-right">
                <div class="text-[10px] font-mono text-slate-400">Starting from</div>
                <div class="text-2xl font-mono font-bold text-white group-hover:text-gold-300 transition-colors">${priceEcon}</div>
                <div class="text-[10px] text-slate-400 font-mono">Business: <span class="text-gold-400 font-semibold">${priceBiz}</span></div>
              </div>

              <button 
                onclick="app.selectFlightAndConfigure('${flight.id}')" 
                class="px-5 py-3 rounded-xl bg-gradient-to-r from-gold-400 to-amber-500 text-midnight-950 font-bold font-mono text-xs uppercase tracking-wider shadow-gold-glow hover:scale-105 active:scale-95 transition-all">
                Select Flight
              </button>
            </div>

          </div>
        </div>
      `;
    }).join('');

    lucide.createIcons();
  }

  // Sort flights
  function sortFlights(criteria) {
    ['cheapest', 'fastest', 'earliest'].forEach(c => {
      const btn = document.getElementById(`sort-${c}`);
      if (btn) {
        if (c === criteria) {
          btn.className = 'px-3 py-1.5 rounded-lg bg-gold-500/20 text-gold-300 border border-gold-400/30 font-medium';
        } else {
          btn.className = 'px-3 py-1.5 rounded-lg text-slate-400 hover:text-white';
        }
      }
    });

    if (criteria === 'cheapest') {
      state.flights.sort((a, b) => a.baseFareUsd - b.baseFareUsd);
    } else if (criteria === 'fastest') {
      state.flights.sort((a, b) => a.durationMinutes - b.durationMinutes);
    } else if (criteria === 'earliest') {
      state.flights.sort((a, b) => a.depHourNumber - b.depHourNumber);
    }

    renderFlightResults();
    playAudioChime('click');
  }

  // Filter modal toggle
  function toggleFlightFilterModal() {
    const modal = document.getElementById('filter-modal');
    modal.classList.toggle('hidden');
    modal.classList.toggle('flex');
    playAudioChime('click');
  }

  function setStopsFilter(stops) {
    ['any', 'nonstop', '1stop'].forEach(s => {
      const b = document.getElementById(`filter-stops-${s}`);
      if (b) {
        if (s === stops) {
          b.className = 'py-2 rounded-xl bg-gold-500/20 text-gold-300 border border-gold-400/40 text-xs font-mono';
        } else {
          b.className = 'py-2 rounded-xl bg-white/5 text-slate-400 border border-white/10 text-xs font-mono';
        }
      }
    });

    let original = generateFlights(state.searchParams.from, state.searchParams.to, state.searchParams.departureDate);
    if (stops === 'nonstop') {
      state.flights = original.filter(f => f.isDirect);
    } else if (stops === '1stop') {
      state.flights = original.filter(f => !f.isDirect);
    } else {
      state.flights = original;
    }
    renderFlightResults();
  }

  function applyAirlineFilter(airline) {
    let original = generateFlights(state.searchParams.from, state.searchParams.to, state.searchParams.departureDate);
    if (airline !== 'all') {
      state.flights = original.filter(f => f.airline.toLowerCase().includes(airline.toLowerCase()));
    } else {
      state.flights = original;
    }
    renderFlightResults();
  }

  // Step 2 -> Step 3: Choose Cabin Class
  function selectFlightAndConfigure(flightId) {
    const flight = state.flights.find(f => f.id === flightId);
    if (!flight) return;
    state.selectedFlight = flight;

    // Set flight header subtitle
    document.getElementById('class-flight-summary').innerText =
      `${flight.flightNumber} • ${flight.airline} • ${flight.aircraft} • Departure: ${flight.departureTime}`;

    renderCabinPrices();
    goToStep(3);
    playAudioChime('click');
  }

  // Render dynamic pricing on cabin class cards
  function renderCabinPrices() {
    if (!state.selectedFlight) return;
    const base = state.selectedFlight.baseFareUsd;

    document.getElementById('price-economy').innerText = formatPrice(base);
    document.getElementById('price-premium').innerText = formatPrice(Math.round(base * 1.75));
    document.getElementById('price-business').innerText = formatPrice(Math.round(base * 3.6));
    document.getElementById('price-first').innerText = formatPrice(Math.round(base * 6.8));
  }

  // Step 3 -> Step 4: Class Selected -> Go to Passenger & Seat Details
  function selectClass(cabinTier) {
    state.selectedClass = cabinTier;

    // Default recommended seat per class
    if (cabinTier === 'first') state.selectedSeat = '1A';
    else if (cabinTier === 'business') state.selectedSeat = '4A';
    else if (cabinTier === 'premium') state.selectedSeat = '10C';
    else state.selectedSeat = '18B';

    document.getElementById('passenger-flight-badge').innerText =
      `${state.selectedFlight.flightNumber} • ${getCabinName(cabinTier)} • Seat ${state.selectedSeat}`;

    renderSeatMap();
    updateFareSummary();
    goToStep(4);
    playAudioChime('click');
  }

  function getCabinName(tier) {
    switch (tier) {
      case 'first': return 'First Class Imperial';
      case 'business': return 'Business Class Suite';
      case 'premium': return 'Premium Economy';
      default: return 'Economy Standard';
    }
  }

  // Aircraft Interactive Seat Grid Generation
  function renderSeatMap() {
    const grid = document.getElementById('airplane-seat-grid');
    grid.innerHTML = '';

    // Generate 6 representative rows based on cabin tier
    const rowConfigs = [
      { row: 1, tier: 'first', seats: ['1A', '', '1D', '1F', '', '1K'] },
      { row: 2, tier: 'first', seats: ['2A', '', '2D', '2F', '', '2K'] },
      { row: 3, tier: 'business', seats: ['3A', '', '3D', '3F', '', '3K'] },
      { row: 4, tier: 'business', seats: ['4A', '', '4D', '4F', '', '4K'] },
      { row: 5, tier: 'business', seats: ['5A', '', '5D', '5F', '', '5K'] },
      { row: 10, tier: 'premium', seats: ['10A', '10B', '', '10D', '10E', '', '10J', '10K'] },
      { row: 18, tier: 'economy', seats: ['18A', '18B', '18C', '', '18D', '18E', '18F'] },
      { row: 19, tier: 'economy', seats: ['19A', '19B', '19C', '', '19D', '19E', '19F'] }
    ];

    const occupiedSeats = new Set(['1D', '2K', '3A', '5D', '10B', '18A', '19E']);

    rowConfigs.forEach(r => {
      const rowDiv = document.createElement('div');
      rowDiv.className = 'flex items-center justify-center gap-1.5';

      // Row Number Label
      const label = document.createElement('span');
      label.className = 'w-5 text-[10px] font-mono text-slate-500 text-right mr-1';
      label.innerText = r.row;
      rowDiv.appendChild(label);

      r.seats.forEach(seatCode => {
        if (!seatCode) {
          // Aisle spacing
          const aisle = document.createElement('div');
          aisle.className = 'w-4';
          rowDiv.appendChild(aisle);
          return;
        }

        const seatBtn = document.createElement('button');
        seatBtn.type = 'button';
        seatBtn.innerText = seatCode;
        seatBtn.dataset.seat = seatCode;

        if (occupiedSeats.has(seatCode)) {
          seatBtn.className = 'seat-btn occupied';
          seatBtn.title = `Seat ${seatCode} (Occupied)`;
        } else if (state.selectedSeat === seatCode) {
          seatBtn.className = 'seat-btn selected';
          seatBtn.title = `Seat ${seatCode} (Selected)`;
        } else {
          seatBtn.className = 'seat-btn available';
          seatBtn.title = `Seat ${seatCode} (Available)`;
          seatBtn.onclick = () => selectSeat(seatCode);
        }

        rowDiv.appendChild(seatBtn);
      });

      grid.appendChild(rowDiv);
    });

    document.getElementById('selected-seat-badge').innerText = `Seat ${state.selectedSeat}`;
    document.getElementById('summary-seat-name').innerText = state.selectedSeat;
    lucide.createIcons();
  }

  function selectSeat(seatCode) {
    state.selectedSeat = seatCode;
    renderSeatMap();
    playAudioChime('click');
  }

  // Update live fare breakdown
  function updateFareSummary() {
    if (!state.selectedFlight) return;
    const base = state.selectedFlight.baseFareUsd;
    let multiplier = 1.0;
    if (state.selectedClass === 'premium') multiplier = 1.75;
    if (state.selectedClass === 'business') multiplier = 3.6;
    if (state.selectedClass === 'first') multiplier = 6.8;

    const baseFareTotal = Math.round(base * multiplier * state.searchParams.passengers);
    const taxes = Math.round(180 * state.searchParams.passengers);
    const carbon = Math.round(50 * state.searchParams.passengers);
    const grandTotal = baseFareTotal + taxes + carbon;

    document.getElementById('summary-base-label').innerText = `${getCabinName(state.selectedClass)} Base Fare (x${state.searchParams.passengers})`;
    document.getElementById('summary-base-price').innerText = formatPrice(baseFareTotal);
    document.getElementById('summary-tax-price').innerText = formatPrice(taxes);
    document.getElementById('summary-carbon-price').innerText = formatPrice(carbon);
    document.getElementById('summary-total-price').innerText = formatPrice(grandTotal);
  }

  // Handle Passenger Form Booking Submission
  function handleBookingSubmit(event) {
    if (event) event.preventDefault();

    const title = document.getElementById('p-title').value;
    const fullName = document.getElementById('p-fullname').value.trim();
    const countryCode = document.getElementById('p-country-code').value;
    const mobile = document.getElementById('p-mobile').value.trim();
    const email = document.getElementById('p-email').value.trim();
    const passport = document.getElementById('p-passport').value.trim();
    const dob = document.getElementById('p-dob').value;
    const meal = document.getElementById('p-meal').value;
    const frequentFlyer = document.getElementById('p-frequent-flyer').value.trim();

    if (!fullName || !mobile || !email || !passport || !dob) {
      alert('Please fill all mandatory passenger identity fields.');
      return;
    }

    // Save Passenger
    state.passenger = {
      title,
      fullName,
      mobile: `${countryCode} ${mobile}`,
      email,
      passport,
      dob,
      meal,
      frequentFlyer: frequentFlyer || 'N/A'
    };

    // Generate Booking PNR
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const pnr = `AETH-${randomNum}`;
    state.bookingRecord = {
      pnr,
      bookingTime: new Date().toISOString(),
      flight: state.selectedFlight,
      cabinClass: state.selectedClass,
      seat: state.selectedSeat,
      passenger: state.passenger
    };

    // Populate Boarding Pass View
    populateBoardingPass();

    // Trigger celebration confetti
    triggerCelebration();

    // Play golden chime
    playAudioChime('success');

    // Switch to confirmation step
    goToStep(5);
  }

  // Populate Boarding Pass View Elements
  function populateBoardingPass() {
    const flight = state.selectedFlight;
    const pass = state.passenger;
    const pnr = state.bookingRecord.pnr;

    document.getElementById('confirmed-pnr').innerText = pnr;
    document.getElementById('pass-pnr-ref').innerText = pnr;
    document.getElementById('pass-class-badge').innerText = getCabinName(state.selectedClass);

    document.getElementById('pass-origin-code').innerText = flight.origin.code;
    document.getElementById('pass-origin-city').innerText = `${flight.origin.city}, ${flight.origin.country}`;
    document.getElementById('pass-dep-time').innerText = flight.departureTime;

    document.getElementById('pass-dest-code').innerText = flight.destination.code;
    document.getElementById('pass-dest-city').innerText = `${flight.destination.city}, ${flight.destination.country}`;
    document.getElementById('pass-arr-time').innerText = flight.arrivalTime;

    document.getElementById('pass-duration').innerText = `${flight.duration} • ${flight.stopsText}`;
    document.getElementById('pass-flight-number').innerText = `${flight.flightNumber} (${flight.aircraft})`;

    document.getElementById('pass-name').innerText = `${pass.title}. ${pass.fullName}`;
    document.getElementById('pass-date').innerText = state.searchParams.departureDate;
    document.getElementById('pass-boarding-time').innerText = '45 min before dep';
    document.getElementById('pass-gate').innerText = `${flight.gate} (${flight.terminal})`;
    document.getElementById('pass-seat').innerText = state.selectedSeat;
    document.getElementById('pass-meal').innerText = pass.meal;
    document.getElementById('pass-airline-name').innerText = `${flight.airline} International`;

    // Baggage text by class
    let baggageText = '1x 23kg Standard';
    if (state.selectedClass === 'premium') baggageText = '2x 23kg Priority';
    if (state.selectedClass === 'business') baggageText = '2x 32kg VIP Club';
    if (state.selectedClass === 'first') baggageText = '3x 32kg Imperial';
    document.getElementById('pass-baggage').innerText = baggageText;

    // Barcode number text
    document.getElementById('pass-barcode-text').innerText = `* ${pnr} - ${flight.flightNumber} - ${state.selectedSeat} *`;
  }

  // Confetti Blast Animation
  function triggerCelebration() {
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#D4AF37', '#F5DEB3', '#AA820A', '#FFFFFF']
      });
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#D4AF37', '#38BDF8', '#818CF8']
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#D4AF37', '#38BDF8', '#818CF8']
        });
      }, 300);
    }
  }

  // Step Navigation Management
  function goToStep(stepNumber) {
    state.currentStep = stepNumber;

    const sections = {
      1: 'search-section',
      2: 'results-section',
      3: 'class-selection-section',
      4: 'passenger-section',
      5: 'confirmation-section'
    };

    // Hide all sections
    Object.values(sections).forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.add('hidden');
    });

    // Show active section
    const activeEl = document.getElementById(sections[stepNumber]);
    if (activeEl) {
      activeEl.classList.remove('hidden');
      activeEl.classList.add('animate-fade-in');
    }

    // Update Breadcrumb Tracker
    document.querySelectorAll('.step-indicator').forEach(ind => {
      const step = parseInt(ind.dataset.step);
      if (step === stepNumber) {
        ind.className = 'step-indicator active flex items-center gap-1.5 text-gold-400 font-semibold';
        const numPill = ind.querySelector('span');
        if (numPill) numPill.className = 'w-5 h-5 rounded-full bg-gold-500/20 border border-gold-400 flex items-center justify-center text-[10px]';
      } else if (step < stepNumber) {
        ind.className = 'step-indicator flex items-center gap-1.5 text-emerald-400';
        const numPill = ind.querySelector('span');
        if (numPill) numPill.className = 'w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-[10px]';
      } else {
        ind.className = 'step-indicator flex items-center gap-1.5 text-slate-500';
        const numPill = ind.querySelector('span');
        if (numPill) numPill.className = 'w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px]';
      }
    });

    // Scroll smoothly to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    lucide.createIcons();
  }

  // Back buttons
  function backToSearch() { goToStep(1); playAudioChime('click'); }
  function backToResults() { goToStep(2); playAudioChime('click'); }
  function backToCabinClass() { goToStep(3); playAudioChime('click'); }
  function resetToSearch() { goToStep(1); playAudioChime('click'); }

  // Save / Download E-Ticket HTML file
  function downloadTicketPDF() {
    const ticketElement = document.getElementById('printable-boarding-pass');
    const blob = new Blob([
      `<!DOCTYPE html><html><head><title>Aetheria Boarding Pass - ${state.bookingRecord.pnr}</title>
      <meta charset="UTF-8">
      <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Plus+Jakarta+Sans:wght@400;600;700&family=Space+Grotesk:wght@600&display=swap" rel="stylesheet">
      <script src="https://cdn.tailwindcss.com"></script>
      <link rel="stylesheet" href="styles.css">
      <style>body { background:#060911; padding:40px; color:#fff; display:flex; justify-content:center; align-items:center; min-height:100vh; font-family:'Plus Jakarta Sans',sans-serif; }</style>
      </head><body><div style="max-width:850px; width:100%">${ticketElement.innerHTML}</div></body></html>`
    ], { type: 'text/html' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Aetheria-Boarding-Pass-${state.bookingRecord.pnr}.html`;
    link.click();
    playAudioChime('click');
  }

  // Close airport dropdowns on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#input-from') && !e.target.closest('#suggestions-from')) {
      const el = document.getElementById('suggestions-from');
      if (el) el.classList.add('hidden');
    }
    if (!e.target.closest('#input-to') && !e.target.closest('#suggestions-to')) {
      const el = document.getElementById('suggestions-to');
      if (el) el.classList.add('hidden');
    }
  });

  // Init default dates on launch
  function initDefaults() {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    const formatYMD = (d) => d.toISOString().split('T')[0];
    const depInput = document.getElementById('input-departure');
    if (depInput) {
      depInput.value = formatYMD(nextWeek);
      depInput.min = formatYMD(today);
    }

    const returnInput = document.getElementById('input-return');
    if (returnInput) {
      const twoWeeks = new Date(today);
      twoWeeks.setDate(today.getDate() + 14);
      returnInput.value = formatYMD(twoWeeks);
      returnInput.min = formatYMD(nextWeek);
    }

    lucide.createIcons();
  }

  // Run on DOM ready
  document.addEventListener('DOMContentLoaded', initDefaults);

  // Expose public API
  return {
    setCurrency,
    setTripType,
    showAirportSuggestions,
    filterAirportSuggestions,
    selectAirport,
    swapAirports,
    quickFill,
    handleSearchSubmit,
    sortFlights,
    toggleFlightFilterModal,
    setStopsFilter,
    applyAirlineFilter,
    selectFlightAndConfigure,
    selectClass,
    selectSeat,
    handleBookingSubmit,
    backToSearch,
    backToResults,
    backToCabinClass,
    resetToSearch,
    downloadTicketPDF
  };
})();

