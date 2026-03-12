import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/apiClient";
import {
  createReservation,
  createPayment,
  submitPaymentProof,
  cancelReservation,
} from "../../services/bookingService";
import { getMySubscription } from "../../services/subscriptionService";
import { getSpaceById } from "../../services/spaceService";
import {
  getEquipmentAvailability,
  lockEquipment,
  unlockEquipment,
  getEquipments,
} from "../../services/equipmentService";
import { getServicesList } from "../../services/serviceService";
import PaymentSelector from "../payment/PaymentSelector";

/**
 * BookingModal Component - CLEAN & LOGICAL VERSION
 * Enforces a single submission to prevent redundant clicks.
 */
const BookingModal = ({
  space,
  coworkingSpaceId,
  initialDate,
  initialChairId,
  onClose,
  editingBooking = null, // New prop for edit mode
}) => {
  const [bookingLoading, setBookingLoading] = useState(false);

  // Helper for quantity lookups (robust against Numeric ID, String documentId, and Names)
  const getQty = (map, item) => {
    if (!map || !item) return 0;
    const nameKey = String(item.name || "")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-");
    const ids = [
      String(item.documentId || ""),
      String(item.id || ""),
      String(item.attributes?.documentId || ""),
      String(item.attributes?.id || ""),
      nameKey,
    ].filter((id) => id && id !== "undefined" && id !== "null");

    for (const val of ids) {
      if (map[val] !== undefined) return map[val];
    }
    return 0;
  };
  const getParams = (map, item) => {
    if (!map || !item) return [];
    const nameKey = String(item.name || "")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-");
    const ids = [
      String(item.documentId || ""),
      String(item.id || ""),
      String(item.attributes?.documentId || ""),
      String(item.attributes?.id || ""),
      nameKey,
    ].filter((id) => id && id !== "undefined" && id !== "null");

    for (const val of ids) {
      if (map[val]) return map[val];
    }
    return [];
  };
  const [showPaymentSelector, setShowPaymentSelector] = useState(false);
  const [createdReservation, setCreatedReservation] = useState(null);
  const [existingReservations, setExistingReservations] = useState([]);
  const [activeSubscription, setActiveSubscription] = useState(null);
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(true);

  const [selectedChair, setSelectedChair] = useState(
    initialChairId ? parseInt(initialChairId) : null,
  );
  const [occupiedChairs, setOccupiedChairs] = useState([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [equipmentQuantities, setEquipmentQuantities] = useState({});
  const [originalQuantities, setOriginalQuantities] = useState({}); // Track what was already booked
  const [serviceQuantities, setServiceQuantities] = useState({});
  const [serviceParams, setServiceParams] = useState({}); // { serviceId: [ { fieldName: value } ] }
  const [activeServiceForm, setActiveServiceForm] = useState(null); // { id, name, fields }
  const [currentEntryData, setCurrentEntryData] = useState({});
  const [formData, setFormData] = useState({
    participants: 1,
    date: initialDate || new Date().toISOString().split("T")[0],
    startTime: "09:00",
    endTime: "18:00",
    allDay: false,
  });
  const [dynamicAvailability, setDynamicAvailability] = useState({});
  const [isSyncingEquipments, setIsSyncingEquipments] = useState(false);
  const [masterEquipments, setMasterEquipments] = useState([]);
  const [masterServices, setMasterServices] = useState([]);

  const navigate = useNavigate();
  const isSubmitting = useRef(false);

  // --- Calendar & View Logic ---
  const [viewDate, setViewDate] = useState(new Date(formData.date));
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  // Adjust for Monday start (0=Sunday in JS, let's make it 0=Monday or just keep it simple)
  const paddingDays = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const monthNames = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
  ];

  const handleMonthChange = (offset) => {
    setViewDate(new Date(currentYear, currentMonth + offset, 1));
  };

  // --- NEW: Initialization for Edit Mode ---
  useEffect(() => {
    if (editingBooking) {
      const attrs = editingBooking.attributes || editingBooking;
      console.log("[BookingModal] Edit Mode Init - Extras:", attrs.extras);

      // Initialize main form data
      const start = attrs.start_time ? new Date(attrs.start_time) : new Date();
      const end = attrs.end_time
        ? new Date(attrs.end_time)
        : new Date(start.getTime() + 3600000);

      const isValidDate = (d) => d instanceof Date && !isNaN(d.getTime());
      const safeISO = (d) =>
        isValidDate(d) ? d.toISOString() : new Date().toISOString();

      setFormData({
        participants:
          attrs.extras?.contact?.participants || attrs.participants || 1,
        date: safeISO(start).split("T")[0],
        startTime: isValidDate(start)
          ? start.getUTCHours().toString().padStart(2, "0") +
            ":" +
            start.getUTCMinutes().toString().padStart(2, "0")
          : "09:00",
        endTime: isValidDate(end)
          ? end.getUTCHours().toString().padStart(2, "0") +
            ":" +
            end.getUTCMinutes().toString().padStart(2, "0")
          : "10:00",
        allDay: attrs.all_day || attrs.is_all_day || false,
      });

      // Initialize normalized quantities
      const normalizeMap = (rawMap) => {
        if (!rawMap) return {};
        const normalized = {};
        Object.keys(rawMap).forEach((key) => {
          normalized[String(key)] = rawMap[key];
        });
        return normalized;
      };

      if (attrs.extras?.equipmentQuantities) {
        const normQtys = normalizeMap(attrs.extras.equipmentQuantities);
        setEquipmentQuantities(normQtys);
        setOriginalQuantities(normQtys);
      } else {
        const eqData = attrs.equipments?.data || attrs.equipments || [];
        const eqQtys = {};
        eqData.forEach((eq) => {
          const id = String(eq.documentId || eq.id);
          eqQtys[id] = 1;
        });
        setEquipmentQuantities(eqQtys);
        setOriginalQuantities(eqQtys);
      }

      if (attrs.extras?.serviceQuantities) {
        setServiceQuantities(normalizeMap(attrs.extras.serviceQuantities));
      } else if (attrs.extras?.serviceParams) {
        // Recovery: If we have params but no quantities, the services in params MUST be selected
        const srvQtys = {};
        Object.keys(attrs.extras.serviceParams).forEach((key) => {
          srvQtys[String(key)] = 1;
        });
        setServiceQuantities(srvQtys);
      } else {
        const srvData = attrs.services?.data || attrs.services || [];
        const srvQtys = {};
        srvData.forEach((s) => {
          const id = String(s.documentId || s.id);
          srvQtys[id] = 1;
        });
        setServiceQuantities(srvQtys);
      }

      if (attrs.extras?.serviceParams) {
        setServiceParams(normalizeMap(attrs.extras.serviceParams));
      }
    }
  }, [editingBooking]);

  const [monthBookings, setMonthBookings] = useState([]);
  const [loadingMonth, setLoadingMonth] = useState(false);

  // --- NEW: Dynamic Hydration for Incomplete Space Data ---
  const [hydratedSpace, setHydratedSpace] = useState(null);
  const [isHydrating, setIsHydrating] = useState(false);

  useEffect(() => {
    const checkAndHydrate = async () => {
      // 1. Get raw attributes
      const currentAttrs = space?.attributes || space;

      // 2. Determine if it's incomplete
      // It's incomplete if it's an ID, or if it lacks pricing, or if it's an empty object
      const hasPrice =
        currentAttrs?.pricing_hourly || currentAttrs?.pricing_daily;
      const isPrimitive =
        typeof space === "string" || typeof space === "number";
      const isEmpty = !currentAttrs || Object.keys(currentAttrs).length === 0;

      const isIncomplete = isPrimitive || isEmpty || !hasPrice;

      // 3. Find the best ID to fetch
      const sId = isPrimitive
        ? space
        : space?.documentId ||
          space?.id ||
          editingBooking?.attributes?.space?.data?.documentId ||
          editingBooking?.attributes?.space?.data?.id ||
          editingBooking?.attributes?.space?.documentId ||
          editingBooking?.attributes?.space?.id ||
          editingBooking?.space?.documentId ||
          editingBooking?.space?.id;

      if (isIncomplete && sId && !hydratedSpace) {
        console.log(`[Diagnostic] Hydration triggered for space ID: ${sId}`);
        setIsHydrating(true);
        try {
          const fullRes = await getSpaceById(sId);
          console.log(`[Diagnostic] Hydration SUCCESS for ${sId}:`, fullRes);
          const fullSpace = fullRes.data || fullRes;
          setHydratedSpace(fullSpace);
        } catch (err) {
          console.error("[Diagnostic] Hydration FAILED", err);
        } finally {
          setIsHydrating(false);
        }
      }
    };
    checkAndHydrate();
  }, [space, editingBooking, hydratedSpace]);

  const activeSpace = hydratedSpace || space;
  if (
    !activeSpace ||
    (typeof activeSpace === "object" &&
      Object.keys(activeSpace).length === 0 &&
      !isHydrating)
  ) {
    // If we have nothing and we're not waiting for hydration, we can't render
    return null;
  }

  const attrs = activeSpace.attributes || activeSpace;
  useEffect(() => {
    const loadMasterData = async () => {
      try {
        const [eqRes, srvRes] = await Promise.all([
          getEquipments(),
          getServicesList(),
        ]);
        setMasterEquipments(eqRes.data || []);
        setMasterServices(srvRes.data || []);
      } catch (err) {
        console.error("[BookingModal] Failed to load master lists:", err);
      }
    };
    loadMasterData();
  }, []);

  let equipmentsList = attrs.equipments?.data || attrs.equipments || [];
  let servicesList = attrs.services?.data || attrs.services || [];

  // --- NEW: Resilient Data Merging for Edit & View Mode ---
  // Ensure that ALL master equipments and services are available for selection,
  // especially helpful if the space-specific relations are broken or shallow.
  if (masterEquipments.length > 0) {
    const existingIds = new Set(
      equipmentsList.map((e) => String(e.documentId || e.id)),
    );
    const additionalEquipments = masterEquipments.filter(
      (me) => !existingIds.has(String(me.documentId || me.id)),
    );
    if (additionalEquipments.length > 0) {
      console.log(
        "[BookingModal] Merging additional equipments from Master List:",
        additionalEquipments.length,
      );
      equipmentsList = [...equipmentsList, ...additionalEquipments];
    }
  }

  if (masterServices.length > 0) {
    const existingSrvIds = new Set(
      servicesList.map((s) => String(s.documentId || s.id)),
    );
    const additionalServices = masterServices.filter(
      (ms) => !existingSrvIds.has(String(ms.documentId || ms.id)),
    );
    if (additionalServices.length > 0) {
      console.log(
        "[BookingModal] Merging additional services from Master List:",
        additionalServices.length,
      );
      servicesList = [...servicesList, ...additionalServices];
    }
  }

  // --- CLIENT-SIDE CONFIGURATION INJECTION ---
  // If a service has configuration: null from the API, inject a known config by name.
  // This ensures the service options overlay works even when the database has not been seeded.
  const CLIENT_SIDE_CONFIGS = {
    impression: {
      fields: [
        {
          name: "file",
          type: "file",
          label: "Uploader le document",
          required: true,
        },
        {
          name: "pages",
          type: "number",
          label: "Nombre de copies",
          min: 1,
          default: 1,
          required: true,
        },
        {
          name: "color",
          type: "select",
          label: "Couleur",
          options: ["Noir & Blanc", "Couleur"],
          default: "Noir & Blanc",
        },
      ],
    },
    "catering / déjeuner": {
      fields: [
        {
          name: "menu",
          type: "select",
          label: "Choix du menu",
          options: ["Standard", "Végétarien", "Vegan", "Premium"],
          default: "Standard",
          required: true,
        },
        {
          name: "quantite",
          type: "number",
          label: "Nombre de repas",
          min: 1,
          default: 1,
          required: true,
        },
        {
          name: "allergies",
          type: "text",
          label: "Allergies éventuelles",
          placeholder: "Ex: Sans gluten",
        },
      ],
    },
    "caféteria premium": {
      fields: [
        {
          name: "preferences",
          type: "text",
          label: "Préférences / allergies",
          placeholder: "Ex: Sans gluten...",
        },
      ],
    },
    "café et boissons à volonté": {
      fields: [
        {
          name: "boisson",
          type: "select",
          label: "Type de boisson",
          options: ["Café Noir", "Cappuccino", "Thé Menthe", "Eau"],
          required: true,
        },
        {
          name: "quantite",
          type: "number",
          label: "Nombre de boissons",
          min: 1,
          default: 1,
          required: true,
        },
      ],
    },
    "cafétérie premium": {
      fields: [
        {
          name: "boisson",
          type: "select",
          label: "Type de boisson",
          options: ["Café Noir", "Cappuccino", "Thé Menthe", "Eau"],
          required: true,
        },
        {
          name: "quantite",
          type: "number",
          label: "Nombre de boissons",
          min: 1,
          default: 1,
          required: true,
        },
      ],
    },
    "support technique it": {
      fields: [
        {
          name: "type",
          type: "select",
          label: "Nature du besoin",
          options: [
            "Aide Réseau/WiFi",
            "Installation Logiciel",
            "Configuration Matériel",
          ],
          required: true,
        },
        {
          name: "details",
          type: "text",
          label: "Précisions",
          placeholder: "Ex: Installation de Docker",
        },
      ],
    },
    "vidéoprojecteur hd": {
      fields: [
        {
          name: "connector",
          type: "select",
          label: "Type de connecteur",
          options: ["HDMI", "VGA", "USB-C"],
          default: "HDMI",
        },
      ],
    },
  };

  servicesList = servicesList.map((s) => {
    const sName = (s.name || s.attributes?.name || "").toLowerCase().trim();
    const hasConfig = !!(
      s.configuration?.fields?.length ||
      s.attributes?.configuration?.fields?.length
    );
    if (!hasConfig && CLIENT_SIDE_CONFIGS[sName]) {
      return { ...s, configuration: CLIENT_SIDE_CONFIGS[sName] };
    }
    return s;
  });

  // FORCE FALLBACK for Equipments if list is STILL empty and NOT editing
  if (equipmentsList.length === 0 && !isHydrating && !editingBooking) {
    equipmentsList = [
      {
        id: "fallback-screen",
        name: "Écran 4K",
        price: 10,
        price_type: "one-time",
      },
      {
        id: "fallback-projector",
        name: "Vidéoprojecteur",
        price: 20,
        price_type: "one-time",
      },
      {
        id: "fallback-whiteboard",
        name: "Tableau Blanc",
        price: 5,
        price_type: "one-time",
      },
    ];
  }

  // FORCE FALLBACK for Services if list is empty (for testing/CORS issues)
  if (servicesList.length === 0) {
    servicesList = [
      {
        id: "fallback-print",
        name: "Impression",
        price: 0.2,
        price_type: "one-time",
        configuration: {
          fields: [
            {
              name: "file",
              type: "file",
              label: "Uploader le document",
              required: true,
            },
            {
              name: "pages",
              type: "number",
              label: "Nombre de copies",
              min: 1,
              default: 1,
              required: true,
            },
          ],
        },
      },
      {
        id: "fallback-catering",
        name: "Catering / Déjeuner",
        price: 15,
        price_type: "one-time",
        configuration: {
          fields: [
            {
              name: "menu",
              type: "select",
              label: "Choix du menu",
              options: ["Végétarien", "Standard", "Premium"],
              required: true,
            },
            {
              name: "quantite",
              type: "number",
              label: "Nombre de repas",
              min: 1,
              default: 1,
              required: true,
            },
            {
              name: "allergies",
              type: "text",
              label: "Allergies éventuelles",
              placeholder: "Ex: Sans gluten",
            },
          ],
        },
      },
      {
        id: "fallback-it-support",
        name: "Support Technique IT",
        price: 25,
        price_type: "one-time",
        configuration: {
          fields: [
            {
              name: "type",
              type: "select",
              label: "Nature du besoin",
              options: [
                "Aide Réseau/WiFi",
                "Installation Logiciel",
                "Configuration Matériel",
              ],
              required: true,
            },
            {
              name: "quantite",
              type: "number",
              label: "Nombre d'heures",
              min: 1,
              default: 1,
              required: true,
            },
            {
              name: "details",
              type: "text",
              label: "Précisions",
              placeholder: "Ex: Installation de Docker",
            },
          ],
        },
      },
      {
        id: "fallback-coffee",
        name: "Cafétérie Premium",
        price: 5,
        price_type: "one-time",
        configuration: {
          fields: [
            {
              name: "boisson",
              type: "select",
              label: "Type de boisson",
              options: ["Café Noir", "Cappuccino", "Thé Menthe"],
              required: true,
            },
            {
              name: "quantite",
              type: "number",
              label: "Nombre de boissons",
              min: 1,
              default: 1,
              required: true,
            },
          ],
        },
      },
    ];
  }

  console.log("[DEBUG] BookingModal - activeSpace object:", activeSpace);
  console.log("[DEBUG] BookingModal - equipmentsList:", equipmentsList);
  console.log("[DEBUG] BookingModal - servicesList:", servicesList);

  // Sync Equipment Availability helper function
  const syncEquipmentAvailability = async () => {
    const spaceRef = activeSpace?.id || space?.id;
    if (!spaceRef || !formData.date) return;
    setIsSyncingEquipments(true);
    try {
      const startISO = `${formData.date}T${formData.startTime}:00.000Z`;
      const endISO = formData.allDay
        ? `${formData.date}T23:59:59.999Z`
        : `${formData.date}T${formData.endTime}:00.000Z`;

      // When editing, exclude the current booking so its equipment doesn't appear unavailable
      // Prefer documentId for Strapi v5 consistency
      const excludeId = editingBooking?.documentId || editingBooking?.id;

      const availabilityMap = {};
      for (const eq of equipmentsList) {
        const id = eq.id || eq.documentId;
        if (String(id).startsWith("fallback-")) {
          availabilityMap[id] = Infinity; // Infinity avoids "Rupture" and 0 checks
          continue;
        }
        const available = await getEquipmentAvailability(
          id,
          startISO,
          endISO,
          excludeId,
        );
        availabilityMap[id] = available;
      }
      setDynamicAvailability(availabilityMap);
    } catch (err) {
      console.error("Failed to sync equipment availability:", err);
    } finally {
      setIsSyncingEquipments(false);
    }
  };

  // Effects
  useEffect(() => {
    // Initial sync and then set up interval
    syncEquipmentAvailability();

    const interval = setInterval(syncEquipmentAvailability, 10000);
    return () => clearInterval(interval);
  }, [
    formData.date,
    formData.startTime,
    formData.endTime,
    formData.allDay,
    equipmentsList.length,
  ]);

  useEffect(() => {
    const fetchSub = async () => {
      try {
        const userString = localStorage.getItem("user");
        if (userString) {
          const user = JSON.parse(userString);
          setIsCheckingSubscription(true);
          const sub = await getMySubscription(user.id);
          setActiveSubscription(sub);
        }
      } catch (err) {
        console.error("Failed to fetch subscription:", err);
      } finally {
        setIsCheckingSubscription(false);
      }
    };
    fetchSub();
  }, []);

  // Fetch current reservations for the selected date
  useEffect(() => {
    if (!space?.id || !formData.date) return;

    const checkAvailability = async () => {
      setCheckingAvailability(true);
      try {
        const startOfDay = `${formData.date}T00:00:00.000Z`;
        const endOfDay = `${formData.date}T23:59:59.999Z`;

        let idFilter = `filters[space][id][$eq]=${space.id}`;
        if (attrs._is_virtual && attrs._originalIds) {
          idFilter = attrs._originalIds
            .map((id, idx) => `filters[space][id][$in][${idx}]=${id}`)
            .join("&");
        }

        const response = await api.get(
          `/bookings?${idFilter}&filters[start_time][$lt]=${endOfDay}&filters[end_time][$gt]=${startOfDay}&filters[status][$ne]=cancelled`,
        );
        const resList = response.data?.data || [];
        setExistingReservations(resList);

        // If per-chair, calculate HOW MANY chairs are taken during the selected time
        if (attrs.is_per_chair) {
          const startTimeMs = new Date(
            `${formData.date}T${formData.startTime}:00.000Z`,
          ).getTime();
          const endTimeMs = formData.allDay
            ? new Date(`${formData.date}T23:59:59.999Z`).getTime()
            : new Date(
                `${formData.date}T${formData.endTime}:00.000Z`,
              ).getTime();

          const takenCount = resList
            .filter((r) => {
              const rStart = new Date(
                r.attributes?.start_time || r.start_time,
              ).getTime();
              const rEnd = new Date(
                r.attributes?.end_time || r.end_time,
              ).getTime();
              return startTimeMs < rEnd && rStart < endTimeMs;
            })
            .reduce(
              (sum, r) => sum + ((r.attributes || r).participants || 1),
              0,
            );

          setOccupiedChairs(takenCount); // Now an integer, not an array
        }
      } catch (err) {
        console.error("Availability check failed:", err);
      } finally {
        setCheckingAvailability(false);
      }
    };
    checkAvailability();
  }, [
    space?.id,
    formData.date,
    formData.startTime,
    formData.endTime,
    formData.allDay,
    attrs.is_per_chair,
  ]);

  // Sync viewDate when formData.date changes
  useEffect(() => {
    setViewDate(new Date(formData.date));
  }, [formData.date]);

  // --- NEW: Fetch all bookings for the month to show busy days ---
  useEffect(() => {
    if (!space?.id) return;

    const fetchMonthAvailability = async () => {
      setLoadingMonth(true);
      try {
        const currentYear = viewDate.getFullYear();
        const currentMonth = viewDate.getMonth();
        const startOfMonth = new Date(
          currentYear,
          currentMonth,
          1,
        ).toISOString();
        const endOfMonth = new Date(
          currentYear,
          currentMonth + 1,
          0,
          23,
          59,
          59,
        ).toISOString();

        const response = await api.get(
          `/bookings?filters[space][id][$eq]=${space.id}&filters[start_time][$gte]=${startOfMonth}&filters[end_time][$lte]=${endOfMonth}&filters[status][$ne]=cancelled`,
        );
        setMonthBookings(response.data?.data || []);
      } catch (err) {
        console.error("Failed to fetch month availability:", err);
      } finally {
        setLoadingMonth(false);
      }
    };

    fetchMonthAvailability();
  }, [space?.id, viewDate.getMonth(), viewDate.getFullYear()]);

  // Keep a ref to always have latest quantities for the cleanup on unmount
  const equipmentQuantitiesRef = useRef(equipmentQuantities);
  useEffect(() => {
    equipmentQuantitiesRef.current = equipmentQuantities;
  }, [equipmentQuantities]);

  // Only unlock on actual unmount (modal close), NOT on every state change
  useEffect(() => {
    return () => {
      const qtys = equipmentQuantitiesRef.current;
      if (Object.keys(qtys).length > 0) {
        Object.keys(qtys).forEach((id) => {
          unlockEquipment(id).catch((err) =>
            console.error("Unlock failed during cleanup:", err),
          );
        });
      }
    };
  }, []); // empty deps → runs cleanup ONLY on unmount

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Use a REF (not state) for in-progress flag so it blocks synchronously before re-render
  const updatingEqRef = useRef({});

  const updateEquipmentQuantity = async (eqId, delta, maxQuantity) => {
    if (updatingEqRef.current[eqId]) return;

    const current = equipmentQuantities[eqId] || 0;
    const next = current + delta;

    if (next < 0) return;
    if (delta > 0 && maxQuantity <= 0) {
      alert("Cet équipement n'est plus disponible.");
      return;
    }

    // Optimistic Update
    setEquipmentQuantities((prev) => {
      const nextVal = Math.max(0, (prev[eqId] || 0) + delta);
      if (nextVal === 0) {
        const { [eqId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [eqId]: nextVal };
    });

    updatingEqRef.current = { ...updatingEqRef.current, [eqId]: true };

    try {
      if (delta > 0) {
        const startISO = `${formData.date}T${formData.startTime}:00.000Z`;
        const endISO = formData.allDay
          ? `${formData.date}T23:59:59.999Z`
          : `${formData.date}T${formData.endTime}:00.000Z`;

        console.log(`[Booking] Locking equipment ${eqId}...`);
        await lockEquipment(eqId, startISO, endISO);
      } else if (delta < 0) {
        console.log(`[Booking] Unlocking equipment ${eqId}...`);
        await unlockEquipment(eqId);
      }

      await syncEquipmentAvailability();
    } catch (err) {
      console.error("[Booking] Error updating equipment:", err);
      // Rollback on error
      setEquipmentQuantities((prev) => {
        const rolledBackVal = Math.max(0, (prev[eqId] || 0) - delta);
        if (rolledBackVal === 0) {
          const { [eqId]: _, ...rest } = prev;
          return rest;
        }
        return { ...prev, [eqId]: rolledBackVal };
      });

      const msg =
        err.response?.data?.error?.message ||
        "Erreur lors de la mise à jour de l'équipement.";
      alert(msg);
    } finally {
      updatingEqRef.current = { ...updatingEqRef.current, [eqId]: false };
    }
  };

  const updateServiceQuantity = (srv, delta) => {
    const srvId = String(srv.documentId || srv.id);
    if (delta > 0) {
      // Open the form overlay to add a new entry
      const sAttrs = srv.attributes || srv;
      const config = sAttrs.configuration;
      const fields = config?.fields || [];

      if (fields.length > 0) {
        setActiveServiceForm(srv);

        // Pre-populate with default values
        const defaults = {};
        fields.forEach((f) => {
          if (f.default !== undefined) defaults[f.name] = f.default;
        });
        setCurrentEntryData(defaults);
        return;
      }
    }

    setServiceQuantities((prev) => {
      const current = prev[srvId] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        setServiceParams((p) => {
          const { [srvId]: _, ...rest } = p;
          return rest;
        });
        const { [srvId]: _, ...rest } = prev;
        return rest;
      }

      // If decrementing, remove the last entry
      if (delta < 0) {
        setServiceParams((p) => ({
          ...p,
          [srvId]: (p[srvId] || []).slice(0, -1),
        }));
      }

      return { ...prev, [srvId]: next };
    });
  };

  const handleSaveServiceEntry = () => {
    const srvId = String(activeServiceForm.documentId || activeServiceForm.id);

    setServiceParams((prev) => ({
      ...prev,
      [srvId]: [...(prev[srvId] || []), currentEntryData],
    }));

    setServiceQuantities((prev) => ({
      ...prev,
      [srvId]: (prev[srvId] || 0) + 1,
    }));

    setActiveServiceForm(null);
    setCurrentEntryData({});
  };

  const handleServiceParamChange = (fieldName, value) => {
    setCurrentEntryData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const handleNavigateToPlans = () => {
    const userString = localStorage.getItem("user");
    const user = userString ? JSON.parse(userString) : null;
    const rawRole = (user?.user_type || "student").toLowerCase();

    // Mapping based on App.jsx routes
    let target = "/subscription-plans"; // Fallback public page
    if (rawRole === "etudiant" || rawRole === "student")
      target = "/student/subscription";
    else if (rawRole === "formateur" || rawRole === "trainer")
      target = "/trainer/subscription";
    else if (rawRole === "professional") target = "/professional/subscription";
    else if (rawRole === "association") target = "/association/subscription";

    navigate(target);
  };

  const handleAbandonBooking = async () => {
    const identifier = createdReservation?.documentId || createdReservation?.id;
    if (identifier) {
      try {
        console.log(
          `[Professional Flow] Cleaning up abandoned reservation: ${identifier}`,
        );
        await cancelReservation(identifier);
      } catch (err) {
        console.error("Failed to cleanup reservation:", err);
      }
    }
  };

  const handleBooking = async () => {
    // CRITICAL: Block any double-submission immediately
    if (isSubmitting.current) return;

    isSubmitting.current = true;
    setBookingLoading(true);

    try {
      const userString = localStorage.getItem("user");
      const user = userString ? JSON.parse(userString) : null;

      // When booking is_per_chair, ensure they selected participants (chairs)
      if (attrs.is_per_chair) {
        const requestedChairs = parseInt(formData.participants) || 0;
        const availableChairs = Math.max(
          0,
          (attrs.capacity || 1) -
            (typeof occupiedChairs === "number" ? occupiedChairs : 0),
        );

        if (requestedChairs <= 0) {
          alert("Veuillez indiquer le nombre de chaises à réserver.");
          setBookingLoading(false);
          isSubmitting.current = false;
          return;
        }

        if (requestedChairs > availableChairs) {
          alert(`Il ne reste que ${availableChairs} chaise(s) disponible(s).`);
          setBookingLoading(false);
          isSubmitting.current = false;
          return;
        }
      }

      if (!user) {
        alert("Veuillez vous connecter pour réserver.");
        navigate("/login");
        setBookingLoading(false);
        isSubmitting.current = false;
        return;
      }

      // Format ISO strings for start_time and end_time
      const datePart = formData.date;
      const startISO = `${datePart}T${formData.startTime}:00.000Z`;
      const endISO = formData.allDay
        ? `${datePart}T23:59:59.999Z`
        : `${datePart}T${formData.endTime}:00.000Z`;

      // IDs for relations in Strapi v5 should ideally use the { connect: [...] } syntax
      const spaceTargetId =
        attrs._is_virtual && attrs._originalIds
          ? attrs._originalIds[0]
          : space.documentId || space.id;

      const filteredEquipments = Object.keys(equipmentQuantities).filter(
        (id) =>
          !String(id).startsWith("fallback-") && equipmentQuantities[id] > 0,
      );

      const filteredServices = Object.keys(serviceQuantities).filter(
        (id) =>
          !String(id).startsWith("fallback-") && serviceQuantities[id] > 0,
      );

      const bookingData = {
        user: { connect: [user.id] },
        space: { connect: [spaceTargetId] },
        start_time: startISO,
        end_time: endISO,
        status: "pending",
        total_price: parseFloat(calculateTotalPrice()),
        equipments: {
          connect: filteredEquipments.map((id) =>
            isNaN(parseInt(id)) ? id : parseInt(id),
          ),
        },
        services: {
          connect: filteredServices.map((id) =>
            isNaN(parseInt(id)) ? id : parseInt(id),
          ),
        },
        extras: {
          spaceName:
            attrs.name ||
            (attrs.mesh_name
              ? attrs.mesh_name
                  .replace(/bureau_/i, "Bureau ")
                  .replace(/_/g, " ")
              : "Espace"),
          spaceId: spaceTargetId,
          coworkingName: "SunSpace",
          equipmentQuantities: Object.fromEntries(
            Object.entries(equipmentQuantities).filter(([_, q]) => q > 0),
          ),
          serviceQuantities: Object.fromEntries(
            Object.entries(serviceQuantities).filter(([_, q]) => q > 0),
          ),
          serviceParams: serviceParams,
          chairId: selectedChair,
          contact: {
            participants: formData.participants,
          },
        },
      };

      if (editingBooking) {
        const docId = editingBooking.documentId || editingBooking.id;
        console.log("[Booking] Updating reservation:", docId, bookingData);
        await (
          await import("../../services/bookingService")
        ).updateReservation(docId, bookingData);
        window.alert("Réservation modifiée avec succès !");
        onClose();
        if (typeof fetchData === "function") fetchData(); // Refresh if prop exists

        // Dynamic redirection based on user type to prevent "student" fallback for associations/trainers
        const role = (user.user_type || "student").toLowerCase();
        let targetPath = "/student/bookings";
        if (role === "professional") targetPath = "/professional/bookings";
        else if (role === "association") targetPath = "/association/bookings";
        else if (role === "trainer" || role === "formateur")
          targetPath = "/trainer/bookings";

        navigate(targetPath);
        return;
      }

      console.log(
        "[Booking] Final Submission Data (v5 Connect Syntax):",
        JSON.stringify(bookingData, null, 2),
      );

      console.log("[Booking] Logic: Creating booking...", bookingData);
      const res = await createReservation(bookingData);
      setCreatedReservation(res.data);
      console.log(
        "[Booking] Created reservation - id:",
        res.data?.id,
        "| documentId:",
        res.data?.documentId,
      );

      const createdRes = res.data?.attributes || res.data || {};
      const actualStatus = createdRes.status;

      if (actualStatus === "confirmed") {
        window.alert("Réservation confirmée ! (Validé par votre abonnement)");
        onClose();
        const userObj = JSON.parse(localStorage.getItem("user") || "{}");
        const role = (userObj.user_type || "student").toLowerCase();
        let targetPath = "/student/bookings";
        if (role === "professional") targetPath = "/professional/bookings";
        else if (role === "association") targetPath = "/association/bookings";
        else if (role === "trainer" || role === "formateur")
          targetPath = "/trainer/bookings";

        navigate(targetPath);
      } else {
        setShowPaymentSelector(true);
      }
      setBookingLoading(false);
    } catch (error) {
      console.error("Booking Error Full Output:", error);
      if (error.response) {
        console.error("Server Error Details:", error.response.data);
      }

      const serverMsg = error.response?.data?.error?.message;
      const errorDetails = error.response?.data?.error?.details
        ? JSON.stringify(error.response.data.error.details)
        : "";

      const errorMsg = serverMsg || error.message || "Une erreur est survenue.";
      window.alert(`Oups ! ${errorMsg}\n${errorDetails}`);

      setBookingLoading(false);
      isSubmitting.current = false;
    }
  };

  const handlePaymentConfirm = async ({ method, file }) => {
    setBookingLoading(true);
    try {
      // Strapi v5: use documentId for PUT/relation, numeric id for relation FK
      const bookingId =
        createdReservation?.documentId || createdReservation?.id;
      const paymentData = {
        amount:
          createdReservation.attributes?.total_price ||
          createdReservation.total_price,
        method: method,
        booking: createdReservation?.id, // FK relation uses numeric id
        status: "pending",
      };

      console.log("[Payment] Creating payment record:", paymentData);
      const paymentRes = await createPayment(paymentData);
      const paymentDocId = paymentRes.data?.documentId || paymentRes.data?.id;

      if (method === "bank_transfer" && file) {
        console.log("[Payment] Submitting proof for:", paymentDocId);
        await submitPaymentProof(paymentDocId, file);
      }

      // Store the payment_method on the booking so the backend cron can check it
      // For on_site payments: also set the payment_deadline = now + 2 minutes (testing)
      const bookingDocId =
        createdReservation?.documentId || createdReservation?.id;
      if (bookingDocId) {
        try {
          const updateData = { payment_method: method };
          if (method === "on_site") {
            // 2 hours for production
            updateData.payment_deadline = new Date(
              Date.now() + 2 * 60 * 60 * 1000,
            ).toISOString();
          }
          console.log(
            "[Payment] Updating booking with payment_method + deadline:",
            updateData,
          );
          await (
            await import("../../services/bookingService")
          ).updateReservation(bookingDocId, updateData);
        } catch (updateErr) {
          console.warn(
            "[Payment] Could not update booking payment_method:",
            updateErr,
          );
        }
      }

      window.alert(
        "Paiement enregistré ! Votre réservation est en attente de validation par l'administrateur.",
      );

      onClose();
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      navigate(
        user.user_type === "professional"
          ? "/professional/bookings"
          : "/student/bookings",
      );
    } catch (error) {
      console.error("Payment Error:", error);
      alert(
        "Erreur lors de l'enregistrement du paiement. Veuillez contacter le support.",
      );
      setBookingLoading(false);
    }
  };

  const hours = Array.from({ length: 15 }).map(
    (_, i) => `${(i + 8).toString().padStart(2, "0")}:00`,
  );

  const calculateTotalPrice = () => {
    if (!attrs) return 0;

    // Ensure we have a valid date string
    const datePart = formData.date || new Date().toISOString().split("T")[0];
    const startStr = `${datePart}T${formData.startTime || "09:00"}:00`;
    const endStr = `${datePart}T${formData.endTime || "18:00"}:00`;

    const start = new Date(startStr);
    const end = new Date(endStr);

    let durationMs = 0;
    if (formData.allDay) {
      durationMs = 8 * 3600000; // 8 hours for a full day
    } else if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
      durationMs = end.getTime() - start.getTime();
    }

    const durationHours = Math.max(0, durationMs / (1000 * 60 * 60));
    const durationDays = formData.allDay ? 1 : Math.ceil(durationHours / 24);

    let total = 0;

    // Base Space Price - handle potential string values from API
    let pHourly = parseFloat(attrs.pricing_hourly || 0);
    let pDaily = parseFloat(attrs.pricing_daily || 0);

    // EMERGENCY FALLBACK if prices are 0 in DB (Consistent with header UI)
    if (pHourly === 0 && pDaily === 0) {
      const type = attrs.type || "";
      if (type === "event-space") {
        pHourly = 20;
        pDaily = 150;
      } else if (type === "meeting-room") {
        pHourly = 15;
        pDaily = 100;
      } else {
        // hot-desk or other
        pHourly = 5;
        pDaily = 40;
      }
    }

    const participants = parseInt(formData.participants) || 1;
    let spaceSubtotal = 0;

    if (!formData.allDay && durationHours < 8 && pHourly > 0) {
      spaceSubtotal = durationHours * pHourly * participants;
    } else if (pDaily > 0) {
      spaceSubtotal = durationDays * pDaily * participants;
    } else if (pHourly > 0) {
      spaceSubtotal = durationHours * pHourly * participants;
    }

    total += spaceSubtotal;

    console.log("[DEBUG] Pricing Breakdown:", {
      spaceName: attrs.name,
      pHourly,
      pDaily,
      durationHours,
      durationDays,
      allDay: formData.allDay,
      spaceSubtotal,
      currentTotal: total,
    });

    // Equipment Price
    equipmentsList.forEach((eq) => {
      const eqAttrs = eq.attributes || eq;
      const qty = getQty(equipmentQuantities, eq);
      const pEq = parseFloat(eqAttrs.price || 0);

      if (qty > 0 && pEq > 0) {
        const pt = eqAttrs.price_type || "one-time";
        let subtotal = 0;
        if (pt === "hourly") subtotal = durationHours * pEq * qty;
        else if (pt === "daily") subtotal = durationDays * pEq * qty;
        else subtotal = pEq * qty;

        console.log(
          `[DEBUG] Adding Equipment: ${eqAttrs.name || eq.id}, qty=${qty}, unitPrice=${pEq}, type=${pt}, subtotal=${subtotal}`,
        );
        total += subtotal;
      }
    });

    // Service Price
    servicesList.forEach((srv) => {
      const srvAttrs = srv.attributes || srv;
      const pSrv = parseFloat(srvAttrs.price || 0);
      const entries = getParams(serviceParams, srv);

      if (pSrv > 0 && entries.length > 0) {
        const pt = srvAttrs.price_type || "one-time";

        entries.forEach((entry, idx) => {
          // Look for any field that might represent a quantity (pages, copies, etc.)
          const entryQty = parseFloat(
            entry.pages || entry.copies || entry.quantite || 1,
          );

          let subtotal = 0;
          if (pt === "hourly") subtotal = durationHours * pSrv * entryQty;
          else if (pt === "daily") subtotal = durationDays * pSrv * entryQty;
          else subtotal = pSrv * entryQty;

          total += subtotal;
        });
      }
    });

    // Handle extra fee from service base quantity if any
    servicesList.forEach((srv) => {
      const qty = getQty(serviceQuantities, srv);
      const params = getParams(serviceParams, srv);
      if (qty > 0 && params.length === 0) {
        // If service selected but no entries, at least add base price if it's meant to be unit-based
        const sAttrs = srv.attributes || srv;
        if (sAttrs.price_type === "one-time") {
          total += parseFloat(sAttrs.price || 0) * qty;
        }
      }
    });

    console.log("[Pricing] Breakdown:", {
      space: spaceSubtotal,
      total,
      participants,
      durationHours,
      serviceQtys: serviceQuantities,
      serviceParams: serviceParams,
    });
    return total.toFixed(2);
  };

  const hasConflict = attrs.is_per_chair
    ? (parseInt(formData.participants) || 0) >
      Math.max(
        0,
        (attrs.capacity || 1) -
          (typeof occupiedChairs === "number" ? occupiedChairs : 0),
      )
    : (!formData.allDay &&
        existingReservations.some((res) => {
          if (
            editingBooking &&
            (res.documentId === editingBooking.documentId ||
              res.id === editingBooking.id)
          ) {
            return false; // Ignore current booking being edited
          }
          const resStart = new Date(
            res.attributes?.start_time || res.start_time,
          ).getTime();
          const resEnd = new Date(
            res.attributes?.end_time || res.end_time,
          ).getTime();

          const datePart = formData.date;
          const reqStart = new Date(
            `${datePart}T${formData.startTime}:00.000Z`,
          ).getTime();
          const reqEnd = new Date(
            `${datePart}T${formData.endTime}:00.000Z`,
          ).getTime();

          return reqStart < resEnd && resStart < reqEnd;
        })) ||
      (formData.allDay &&
        existingReservations.length > 0 &&
        !(
          editingBooking &&
          existingReservations.length === 1 &&
          (existingReservations[0].documentId === editingBooking.documentId ||
            existingReservations[0].id === editingBooking.id)
        ));

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 scroll-smooth">
      <div className="bg-white w-full max-w-6xl rounded-[3rem] overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[95vh] relative animate-in zoom-in duration-300">
        <button
          onClick={onClose}
          className="absolute top-8 right-8 text-slate-300 hover:text-slate-600 transition-all z-20 p-2 hover:bg-slate-100 rounded-full"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {/* Info Column */}
        <div className="flex-1 p-12 overflow-y-auto bg-white border-r border-slate-100">
          <header className="mb-10">
            <h2 className="text-4xl font-black text-slate-900 mb-3 uppercase tracking-tighter">
              {attrs.name}
            </h2>
            <div className="flex flex-wrap items-center gap-4 text-[11px] font-black text-slate-400 tracking-widest uppercase">
              <span className="flex items-center gap-1.5">
                👤 Capacité: {attrs.capacity || 20}
              </span>
              {attrs.is_per_chair && (
                <span className="flex items-center gap-1.5 text-blue-600">
                  🪑 Disponibles:{" "}
                  {Math.max(
                    0,
                    (attrs.capacity || 0) -
                      (typeof occupiedChairs === "number" ? occupiedChairs : 0),
                  )}
                </span>
              )}
              <span className="flex items-center gap-1.5 text-emerald-600">
                💰{" "}
                {attrs.pricing_hourly ||
                  (attrs.type === "event-space"
                    ? 20
                    : attrs.type === "meeting-room"
                      ? 15
                      : 5)}
                DT/H ·{" "}
                {attrs.pricing_daily ||
                  (attrs.type === "event-space"
                    ? 150
                    : attrs.type === "meeting-room"
                      ? 100
                      : 40)}
                DT/JOUR
              </span>
            </div>
          </header>

          <section className="mb-10">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
              Description
            </h4>
            <div className="bg-slate-50 p-6 rounded-[1.5rem] text-sm text-slate-600 leading-relaxed italic mb-4">
              {attrs.description ||
                "Un espace de travail moderne parfaitement équipé."}
            </div>

            {attrs.is_per_chair && (
              <div className="flex gap-4 p-4 rounded-xl bg-blue-50/50 border border-blue-100">
                <div className="flex-1 bg-white p-4 rounded-xl text-center shadow-sm">
                  <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">
                    Total des chaises
                  </p>
                  <p className="text-2xl font-black text-slate-700">
                    {attrs.capacity || 1}
                  </p>
                </div>
                <div className="flex-1 bg-white p-4 rounded-xl text-center shadow-sm border border-emerald-100">
                  <p className="text-[10px] uppercase font-black tracking-widest text-emerald-600 mb-1">
                    Disponibles
                  </p>
                  <p className="text-2xl font-black text-emerald-600">
                    {Math.max(
                      0,
                      (attrs.capacity || 1) -
                        (typeof occupiedChairs === "number"
                          ? occupiedChairs
                          : 0),
                    )}
                  </p>
                </div>
              </div>
            )}
          </section>

          <section className="mb-10">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
              Équipements
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {equipmentsList.length > 0 ? (
                equipmentsList.map((eq) => {
                  const id = eq.documentId || eq.id;
                  const attrs = eq.attributes || eq;
                  const qty = getQty(equipmentQuantities, eq);
                  const eqName = attrs.name || eq.name;
                  const eqPrice = attrs.price || eq.price;
                  const eqPriceType = attrs.price_type;
                  // Track what we originally had so we can "add it back" to the static DB availability (which already subtracted it)
                  const isInitiallyReserved = editingBooking
                    ? originalQuantities[id] || 0
                    : 0;

                  // The "pool" is the total quantity available to this specific booking session (Total minus OTHER bookings)
                  const pool =
                    dynamicAvailability[id] ??
                    (attrs.available_quantity !== undefined
                      ? attrs.available_quantity
                      : attrs.total_quantity) + isInitiallyReserved ??
                    (String(id).startsWith("fallback-") ? Infinity : 0);

                  // remainingAvailable is how many more/less we can take from our pool
                  const remainingAvailable = Math.max(0, pool - qty);

                  const isMaintenance = attrs.status === "en_maintenance";
                  const isRupture =
                    attrs.status === "en_rupture" || remainingAvailable <= 0;

                  return (
                    <div
                      key={id}
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${qty > 0 ? "bg-emerald-50 border-emerald-200" : isMaintenance || pool <= 0 ? "bg-slate-50 border-slate-100 opacity-60 grayscale" : "bg-white border-slate-100"}`}
                    >
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
                          {eqName}
                          {attrs.description && (
                            <div className="relative group/info">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="text-slate-300 cursor-help hover:text-blue-500"
                              >
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="16" x2="12" y2="12"></line>
                                <line x1="12" y1="8" x2="12.01" y2="8"></line>
                              </svg>
                              <div className="absolute left-6 top-1/2 -translate-y-1/2 invisible opacity-0 group-hover/info:visible group-hover/info:opacity-100 transition-all z-50 w-56 bg-white border border-slate-100 text-slate-900 p-4 rounded-2xl text-[10px] shadow-2xl pointer-events-none normal-case">
                                <p className="mb-2 text-blue-600 font-black uppercase tracking-widest border-b border-blue-50 pb-2">
                                  Détails de l'équipement
                                </p>
                                <p className="text-slate-600 leading-relaxed">
                                  {attrs.description}
                                </p>
                                <div className="absolute left-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-l border-b border-slate-100 rotate-45"></div>
                              </div>
                            </div>
                          )}
                          {isMaintenance && (
                            <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 rounded-sm uppercase font-black">
                              En maintenance
                            </span>
                          )}
                          {pool <= 0 && !isMaintenance && (
                            <span className="text-[9px] bg-rose-100 text-rose-700 px-1.5 rounded-sm uppercase font-black">
                              Rupture
                            </span>
                          )}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-blue-600 font-black uppercase">
                            {eqPrice}DT
                            {eqPriceType === "hourly"
                              ? "/H"
                              : eqPriceType === "daily"
                                ? "/JOUR"
                                : ""}
                          </span>
                          <span
                            className={`text-[9px] font-black px-1.5 rounded-sm uppercase ${remainingAvailable > 0 ? "bg-blue-100 text-blue-700" : "bg-rose-100 text-rose-700"}`}
                          >
                            Dispo: {remainingAvailable}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() =>
                            updateEquipmentQuantity(id, -1, remainingAvailable)
                          }
                          disabled={isMaintenance || qty <= 0}
                          className="w-8 h-8 rounded-lg bg-white border border-slate-200 font-black disabled:opacity-50"
                        >
                          -
                        </button>
                        <span className="text-sm font-black text-blue-600">
                          {qty}
                        </span>
                        <button
                          onClick={() =>
                            updateEquipmentQuantity(id, 1, remainingAvailable)
                          }
                          disabled={isMaintenance || isRupture}
                          className="w-8 h-8 rounded-lg bg-white border border-slate-200 font-black disabled:opacity-50"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <span className="text-xs italic text-slate-400">
                  Aucun équipement disponible.
                </span>
              )}
            </div>
          </section>

          <section className="mb-10">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
              Services
            </h4>
            <div className="grid grid-cols-1 gap-4">
              {servicesList.length > 0 ? (
                servicesList.map((srv) => {
                  const id = srv.documentId || srv.id;
                  const qty = getQty(serviceQuantities, srv);
                  const attrs = srv.attributes || srv;
                  const config = attrs.configuration;
                  const fields = config?.fields || [];

                  return (
                    <div key={id} className="flex flex-col gap-3">
                      <div
                        className={`flex items-center justify-between p-4 rounded-2xl border transition-all relative group/srv ${qty > 0 ? "bg-blue-50 border-blue-200" : "bg-white border-slate-100"}`}
                      >
                        <div className="flex flex-col flex-1">
                          <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
                            {attrs.name}
                            {fields.length > 0 && (
                              <div className="relative group/info">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="text-slate-300 cursor-help hover:text-blue-500"
                                >
                                  <circle cx="12" cy="12" r="10"></circle>
                                  <line x1="12" y1="16" x2="12" y2="12"></line>
                                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                                </svg>
                                {/* Tooltip on hover - Always show on group/info hover */}
                                <div className="absolute left-6 top-1/2 -translate-y-1/2 invisible opacity-0 group-hover/info:visible group-hover/info:opacity-100 transition-all z-50 w-56 bg-white border border-slate-100 text-slate-900 p-4 rounded-2xl text-[10px] shadow-2xl pointer-events-none">
                                  <p className="mb-3 text-blue-600 font-black uppercase tracking-widest border-b border-blue-50 pb-2">
                                    Détails du service
                                  </p>
                                  <ul className="space-y-2">
                                    {fields.map((f, idx) => (
                                      <li
                                        key={idx}
                                        className="flex flex-col gap-0.5"
                                      >
                                        <span className="text-[9px] text-slate-400 font-bold uppercase">
                                          {f.label}
                                        </span>
                                        <span className="text-slate-600">
                                          {f.type === "file"
                                            ? "Document requis"
                                            : f.type === "number"
                                              ? "Nombre requis"
                                              : "Paramètre sélectionnable"}
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
                                  <div className="absolute left-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-l border-b border-slate-100 rotate-45"></div>
                                </div>
                              </div>
                            )}
                          </span>
                          <span className="text-[10px] text-blue-600 font-black uppercase">
                            {attrs.price}DT
                            {attrs.price_type === "hourly"
                              ? "/H"
                              : attrs.price_type === "daily"
                                ? "/JOUR"
                                : ""}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => updateServiceQuantity(srv, -1)}
                            className="w-8 h-8 rounded-lg bg-white border border-slate-200 font-black"
                          >
                            -
                          </button>
                          <span className="text-sm font-black text-blue-600">
                            {qty}
                          </span>
                          <button
                            onClick={() => updateServiceQuantity(srv, 1)}
                            className="w-8 h-8 rounded-lg bg-white border border-slate-200 font-black"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* List of already added entries for this service */}
                      {qty > 0 && getParams(serviceParams, srv).length > 0 && (
                        <div className="ml-4 space-y-2">
                          {getParams(serviceParams, srv).map((entry, idx) => (
                            <div
                              key={idx}
                              className="p-3 bg-slate-50 border-l-4 border-emerald-400 rounded-r-xl flex items-center justify-between animate-in fade-in slide-in-from-left-2 transition-all"
                            >
                              <div className="flex flex-col gap-1">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                  Entrée #{idx + 1}
                                </span>
                                <div className="flex gap-3 text-[10px] font-bold text-slate-600">
                                  {Object.entries(entry).map(([k, v]) => (
                                    <span key={k}>
                                      {k}:{" "}
                                      <span className="text-blue-600">{v}</span>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <span className="text-xs italic text-slate-400">
                  Aucun service disponible.
                </span>
              )}
            </div>
          </section>

          {attrs.is_per_chair && (
            <section className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-1 h-1 bg-amber-500 rounded-full"></span>{" "}
                Statut des places
              </h4>
              <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100">
                <div className="flex justify-around text-center">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">
                      Capacité de la table
                    </p>
                    <p className="text-2xl font-black text-slate-900">
                      {attrs.capacity || 0}
                    </p>
                  </div>
                  <div className="w-px h-10 bg-slate-200 self-center"></div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">
                      Réservées
                    </p>
                    <p className="text-2xl font-black text-amber-600">
                      {typeof occupiedChairs === "number" ? occupiedChairs : 0}
                    </p>
                  </div>
                  <div className="w-px h-10 bg-slate-200 self-center"></div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">
                      Disponibles
                    </p>
                    <p className="text-2xl font-black text-emerald-600">
                      {Math.max(
                        0,
                        (attrs.capacity || 0) -
                          (typeof occupiedChairs === "number"
                            ? occupiedChairs
                            : 0),
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Selection Column */}
        <div className="w-full md:w-[480px] p-12 bg-slate-50/50 overflow-y-auto">
          <section className="mb-10">
            <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <button
                  onClick={() => handleMonthChange(-1)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
                >
                  ❮
                </button>
                <p className="text-[11px] font-black text-slate-900 uppercase tracking-[0.1em]">
                  {monthNames[currentMonth]} {currentYear}
                </p>
                <button
                  onClick={() => handleMonthChange(1)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
                >
                  ❯
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1.5 mb-2">
                {["L", "M", "M", "J", "V", "S", "D"].map((d, idx) => (
                  <div
                    key={`${d}-${idx}`}
                    className="text-[9px] font-black text-slate-300 text-center uppercase"
                  >
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1.5 text-center">
                {Array.from({ length: paddingDays }).map((_, i) => (
                  <div key={`pad-${i}`} className="h-10" />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateObj = new Date(currentYear, currentMonth, day);
                  const dStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
                  const isPast = dateObj < today;
                  const isSelected = formData.date === dStr;

                  // NEW: Check if this day is full
                  const isFull =
                    !attrs.is_per_chair &&
                    monthBookings.some((b) => {
                      const bStart = new Date(
                        b.attributes?.start_time || b.start_time,
                      )
                        .toISOString()
                        .split("T")[0];
                      // Simple logic: if there is any booking that covers this entire day or a portion of it.
                      // For simplicity, we mark it as "reserved" if there's any non-cancelled booking on that day.
                      // More complex logic could check if ALL time slots are taken.
                      return (
                        bStart === dStr &&
                        !(
                          editingBooking &&
                          (b.documentId === editingBooking.documentId ||
                            b.id === editingBooking.id)
                        )
                      );
                    });

                  return (
                    <button
                      key={day}
                      disabled={isPast || isFull}
                      onClick={() => setFormData((p) => ({ ...p, date: dStr }))}
                      className={`h-10 rounded-xl text-[10px] font-black transition-all flex items-center justify-center relative
                        ${
                          isSelected
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                            : isPast
                              ? "text-slate-200 cursor-not-allowed opacity-40"
                              : isFull
                                ? "text-rose-400 bg-rose-50 cursor-not-allowed"
                                : "text-slate-600 hover:bg-slate-100"
                        }
                      `}
                    >
                      {day}
                      {isFull && (
                        <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-rose-500 rounded-full"></div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="mb-10 space-y-6">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                name="allDay"
                checked={formData.allDay}
                onChange={handleInputChange}
                className="hidden"
              />
              <div
                className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${formData.allDay ? "bg-blue-600 border-blue-600" : "border-slate-200 bg-white"}`}
              >
                {formData.allDay && (
                  <span className="text-white text-xs font-black">✓</span>
                )}
              </div>
              <span className="text-[11px] font-black uppercase text-slate-600">
                Toute la journée
              </span>
            </label>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  setFormData((p) => ({
                    ...p,
                    startTime: "09:00",
                    endTime: "13:00",
                    allDay: false,
                  }))
                }
                className="py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-600 transition-all"
              >
                Matinée (9h-13h)
              </button>
              <button
                type="button"
                onClick={() =>
                  setFormData((p) => ({
                    ...p,
                    startTime: "14:00",
                    endTime: "18:00",
                    allDay: false,
                  }))
                }
                className="py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-600 transition-all"
              >
                Après-midi (14h-18h)
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <select
                name="startTime"
                value={formData.startTime}
                onChange={handleInputChange}
                disabled={formData.allDay}
                className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-xs font-bold"
              >
                {hours.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
              <select
                name="endTime"
                value={formData.endTime}
                onChange={handleInputChange}
                disabled={formData.allDay}
                className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-xs font-bold"
              >
                {hours.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <div className="mb-6 p-6 bg-blue-50 border border-blue-100 rounded-[2rem] flex justify-between items-center">
            <div>
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
                Total Estimé
              </p>
              <h3 className="text-2xl font-black text-blue-600">
                {calculateTotalPrice()} DT
              </h3>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                TVA Incluse
              </p>
              <p className="text-[9px] font-bold text-slate-400 italic">
                Paiement sur place
              </p>
            </div>
          </div>

          <button
            onClick={handleBooking}
            disabled={bookingLoading || hasConflict || isCheckingSubscription}
            className={`w-full py-6 text-white font-black text-[11px] uppercase tracking-[0.2em] rounded-[1.5rem] shadow-2xl transition-all ${bookingLoading || hasConflict || isCheckingSubscription ? "bg-slate-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 active:scale-95 shadow-blue-500/30"}`}
          >
            {isCheckingSubscription
              ? "VÉRIFICATION..."
              : bookingLoading
                ? "VALIDATION..."
                : hasConflict
                  ? "NON DISPONIBLE"
                  : editingBooking
                    ? "METTRE À JOUR LA RÉSERVATION"
                    : "VÉRIFIER & PROCÉDER AU PAIEMENT"}
          </button>

          {!activeSubscription && (
            <button
              onClick={handleNavigateToPlans}
              disabled={bookingLoading || isCheckingSubscription}
              className="mt-4 w-full py-4 bg-white border-2 border-amber-200 text-amber-600 font-black text-[11px] uppercase tracking-[0.2em] rounded-[1.5rem] shadow-xl hover:bg-amber-50 transition-all flex items-center justify-center gap-2"
            >
              <span>💎</span> Acheter un abonnement
            </button>
          )}

          {activeSubscription && activeSubscription.status === "pending" && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-100 rounded-2xl">
              <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest text-center">
                ⏳ Un abonnement est en attente de confirmation.
                <br />
                <button
                  onClick={handleNavigateToPlans}
                  className="mt-2 underline hover:text-amber-700"
                >
                  Voir mon statut
                </button>
              </p>
            </div>
          )}

          <p className="mt-6 text-center text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
            * En cliquant sur confirmer, vous bloquez cet espace et recevez un
            email de confirmation instantanément.
          </p>
        </div>
      </div>
      {showPaymentSelector && (
        <PaymentSelector
          amount={parseFloat(calculateTotalPrice())}
          onSelect={handlePaymentConfirm}
          onCancel={() => {
            handleAbandonBooking();
            setShowPaymentSelector(false);
          }}
          onAbandon={handleAbandonBooking}
        />
      )}

      {/* SERVICE OVERLAY MODAL */}
      {activeServiceForm && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-3xl animate-in zoom-in slide-in-from-bottom-5 duration-500">
            <header className="mb-8">
              <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">
                Configuration
              </h3>
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                {activeServiceForm.attributes?.name || activeServiceForm.name}
              </p>
            </header>

            <div className="space-y-6">
              {(
                activeServiceForm.attributes?.configuration?.fields ||
                activeServiceForm.configuration?.fields ||
                []
              ).map((field) => (
                <div key={field.name} className="flex flex-col gap-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    {field.label}{" "}
                    {field.required && <span className="text-rose-500">*</span>}
                  </label>

                  {field.type === "file" ? (
                    <div className="relative group/file">
                      <input
                        type="file"
                        onChange={(e) =>
                          handleServiceParamChange(
                            field.name,
                            e.target.files[0]?.name,
                          )
                        }
                        className="w-full opacity-0 absolute inset-0 z-10 cursor-pointer"
                      />
                      <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center transition-all group-hover/file:border-blue-300 group-hover/file:bg-blue-50/30">
                        <span className="text-[11px] font-black text-blue-600 uppercase tracking-widest">
                          {currentEntryData[field.name] || "Parcourir..."}
                        </span>
                      </div>
                    </div>
                  ) : field.type === "select" ? (
                    <select
                      onChange={(e) =>
                        handleServiceParamChange(field.name, e.target.value)
                      }
                      value={
                        currentEntryData[field.name] || field.default || ""
                      }
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-[11px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="">Sélectionner...</option>
                      {field.options.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      placeholder={field.placeholder || ""}
                      min={field.min}
                      value={currentEntryData[field.name] || ""}
                      onChange={(e) =>
                        handleServiceParamChange(field.name, e.target.value)
                      }
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-[11px] font-bold text-slate-700 placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-blue-100"
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="mt-10 flex gap-4">
              <button
                onClick={() => setActiveServiceForm(null)}
                className="flex-1 p-4 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveServiceEntry}
                className="flex-[2] bg-blue-600 text-white p-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-blue-200 hover:bg-blue-700 hover:-translate-y-1 transition-all"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingModal;
