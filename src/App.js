import React, { useState, useEffect } from "react";
import {
  Plus,
  Calendar,
  Trash2,
  ClipboardList,
  ArrowRight,
  CheckCircle,
  User,
  LogOut,
  Lock,
  Settings,
  Search,
  AlertTriangle,
  Pencil,
  Save,
  X,
  Bell,
} from "lucide-react";

// --- IMPORTAR FIREBASE ---
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD6vXtRA_BEB09_ZhTw1AObPkgWBwyLdPI",
  authDomain: "cnccd-26905.firebaseapp.com",
  projectId: "cnccd-26905",
  storageBucket: "cnccd-26905.firebasestorage.app",
  messagingSenderId: "627679902789",
  appId: "1:627679902789:web:1806f9837016786377b72c",
  measurementId: "G-9D0KD9Z242"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

  apiKey: "TU_API_KEY_AQUI",
  authDomain: "taller-control.firebaseapp.com",
  projectId: "taller-control",
  storageBucket: "taller-control.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef",
};
// ---------------------------------------------------------

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- CONFIGURACIÓN ---
const STAGES = {
  CUT: {
    id: "cut",
    label: "CUT",
    color: "bg-black text-white border-gray-700",
    btnColor: "bg-gray-900",
    dotColor: "bg-black",
  },
  SANDING: {
    id: "sanding",
    label: "SANDING",
    color: "bg-blue-600 text-white border-blue-800",
    btnColor: "bg-blue-700",
    dotColor: "bg-blue-600",
  },
  MACHINE: {
    id: "machine",
    label: "MACHINE",
    color: "bg-red-600 text-white border-red-800",
    btnColor: "bg-red-700",
    dotColor: "bg-red-600",
  },
  HOLE: {
    id: "hole",
    label: "HOLE",
    color: "bg-yellow-400 text-black border-yellow-600",
    btnColor: "bg-yellow-500 text-black",
    dotColor: "bg-yellow-400",
  },
  READY: {
    id: "ready",
    label: "FINALIZADA",
    color: "bg-amber-900 text-white border-amber-950",
    btnColor: "bg-amber-950",
    dotColor: "bg-amber-900",
  },
  VACUM: {
    id: "vacum",
    label: "ENVIADA",
    color: "bg-green-600 text-white border-green-800",
    btnColor: "bg-green-700",
    dotColor: "bg-green-600",
  },
};

const DESTINATIONS = Object.values(STAGES);
const STAGE_KEYS = Object.keys(STAGES);

const DEFAULT_CLIENTS = [
  "CRS",
  "AXIS",
  "RENCON",
  "LAZO PAINTING",
  "HOUSTON CABINET",
  "METYL",
  "CLOSET FACTORY",
  "LETMOBEL",
  "TOSCANA",
  "PROFESSIONAL DIST",
  "CORE",
  "FREDOM CONST.",
  "TRY COUNTY",
  "DUO MULTI SERV",
  "CUTTING EDGE",
  "C&J HARTMAN",
  "WHITE DIAMMOND",
  "AGBA INVESTMEN",
  "AMERICAN BUILDERS",
  "URQUIZA BROTHERS",
  "CABINET DOORS",
  "CLOSET CONCEPTS",
];

const USERS = [
  { name: "MANAGER", pass: "197310" },
  { name: "SUPERVISOR", pass: "191940" },
  { name: "CNC T1", pass: "123456" },
  { name: "CNC T2", pass: "123456" },
  { name: "SANDING T1", pass: "123456" },
  { name: "SANDING T2", pass: "123456" },
];

const App = () => {
  // --- ESTADOS ---
  const [orders, setOrders] = useState([]); // Ahora viene de la nube
  const [clientList, setClientList] = useState(DEFAULT_CLIENTS); // Podríamos subir esto a la nube luego

  const [currentUser, setCurrentUser] = useState(null);
  const [loginStep, setLoginStep] = useState(0);
  const [tempUser, setTempUser] = useState(null);
  const [pinInput, setPinInput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [filter, setFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [specialFilter, setSpecialFilter] = useState("ALL");

  const [newOrderNum, setNewOrderNum] = useState("");
  const [newClient, setNewClient] = useState(clientList[0]);
  const [newQty, setNewQty] = useState("");
  const [newBoard, setNewBoard] = useState("");
  const [newSqf, setNewSqf] = useState("");
  const [newDate, setNewDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [isRK, setIsRK] = useState(false);
  const [isRS, setIsRS] = useState(false);

  const [batchEdit, setBatchEdit] = useState(null);
  const [actionDate, setActionDate] = useState("");
  const [selectedDestination, setSelectedDestination] = useState("");
  const [editOrderModal, setEditOrderModal] = useState(null);
  const [notification, setNotification] = useState(null);

  // --- CONEXIÓN EN TIEMPO REAL CON FIREBASE ---
  useEffect(() => {
    // Escuchar cambios en la base de datos "orders"
    const q = query(collection(db, "orders"), orderBy("id", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map((doc) => ({
        ...doc.data(),
        firebaseId: doc.id,
      }));
      setOrders(ordersData);
    });
    return () => unsubscribe();
  }, []);

  // --- LOGICA ---
  const sendNotification = (title, body) => {
    setNotification({ title, body });
    setTimeout(() => setNotification(null), 3000);
  };

  const checkOverdue = (dateString) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const today = new Date();
    const diffDays = Math.ceil(Math.abs(today - date) / (1000 * 60 * 60 * 24));
    return diffDays > 3;
  };

  const initiateLogin = (userObj) => {
    setTempUser(userObj);
    setLoginStep(1);
    setPinInput("");
    setErrorMsg("");
  };
  const validatePassword = (e) => {
    e.preventDefault();
    if (pinInput === tempUser.pass) {
      setCurrentUser(tempUser.name);
      setLoginStep(0);
      setTempUser(null);
      setPinInput("");
    } else {
      setErrorMsg("Contraseña Incorrecta");
      setPinInput("");
    }
  };
  const handleLogout = () => {
    setCurrentUser(null);
    setLoginStep(0);
  };

  const handleAddClient = () => {
    const name = window.prompt("NOMBRE DEL NUEVO CLIENTE:");
    if (name) {
      const upperName = name.toUpperCase();
      if (!clientList.includes(upperName)) {
        setClientList([...clientList, upperName].sort());
        if (editOrderModal)
          setEditOrderModal({ ...editOrderModal, client: upperName });
        else setNewClient(upperName);
      } else alert("El cliente ya existe.");
    }
  };

  // --- AGREGAR (GUARDAR EN NUBE) ---
  const addOrder = async (e) => {
    e.preventDefault();
    if (!newOrderNum || !newQty) return;
    const exists = orders.some(
      (o) => o.orderNum.toString().trim() === newOrderNum.toString().trim()
    );
    if (exists) {
      alert(`ERROR: La Orden #${newOrderNum} YA EXISTE.`);
      return;
    }

    const newOrder = {
      id: Date.now(), // ID lógico
      orderNum: newOrderNum,
      client: newClient,
      createdBy: currentUser,
      rk: isRK,
      rs: isRS,
      items: Array.from({ length: Number(newQty) }).map((_, i) => ({
        id: `${Date.now()}-${i}`,
        board: newBoard,
        sqf: newSqf,
        status: "cut",
        updatedBy: currentUser,
        dates: { cut: newDate },
        history: [{ stage: "cut", user: currentUser, date: newDate }],
      })),
    };

    // Guardar en Firestore
    await addDoc(collection(db, "orders"), newOrder);

    setNewOrderNum("");
    setNewBoard("");
    setNewSqf("");
    setNewQty("");
    setIsRK(false);
    setIsRS(false);
    sendNotification("Orden Creada", `#${newOrderNum} guardada en la nube`);
  };

  // --- EDITAR (GUARDAR EN NUBE) ---
  const openEditModal = (order) => {
    const firstItem = order.items[0];
    setEditOrderModal({
      id: order.id,
      firebaseId: order.firebaseId,
      orderNum: order.orderNum,
      client: order.client,
      board: firstItem.board,
      sqf: firstItem.sqf || "",
      rk: order.rk,
      rs: order.rs,
    });
  };

  const saveEditedOrder = async () => {
    if (!editOrderModal) return;

    // Buscar la orden original en el estado local para tener los items actuales
    const originalOrder = orders.find(
      (o) => o.firebaseId === editOrderModal.firebaseId
    );
    if (!originalOrder) return;

    const updatedItems = originalOrder.items.map((item) => ({
      ...item,
      board: editOrderModal.board,
      sqf: editOrderModal.sqf,
    }));

    const orderRef = doc(db, "orders", editOrderModal.firebaseId);
    await updateDoc(orderRef, {
      orderNum: editOrderModal.orderNum,
      client: editOrderModal.client,
      rk: editOrderModal.rk,
      rs: editOrderModal.rs,
      items: updatedItems,
    });

    setEditOrderModal(null);
    sendNotification(
      "Cambios Guardados",
      `Orden #${editOrderModal.orderNum} actualizada`
    );
  };

  // --- MOVER (GUARDAR EN NUBE) ---
  const openBatchModal = (orderId, itemIds, currentStatusId) => {
    const currentIndex = STAGE_KEYS.indexOf(currentStatusId);
    let nextId = "sanding";
    if (currentIndex !== -1 && currentIndex < STAGE_KEYS.length - 1) {
      nextId = STAGE_KEYS[currentIndex + 1];
    }
    setBatchEdit({ orderId, itemIds, currentStatusId });
    setSelectedDestination(nextId);
    setActionDate(new Date().toISOString().split("T")[0]);
  };

  const confirmBatchAdvance = async () => {
    if (!batchEdit || !selectedDestination) return;

    const { orderId, itemIds } = batchEdit;
    const nextStageId = selectedDestination;

    const orderToUpdate = orders.find((o) => o.id === orderId);
    if (!orderToUpdate) return;

    const updatedItems = orderToUpdate.items.map((item) => {
      if (itemIds.includes(item.id)) {
        const prevHistory = item.history || [];
        return {
          ...item,
          status: nextStageId,
          updatedBy: currentUser,
          dates: { ...item.dates, [nextStageId]: actionDate },
          history: [
            ...prevHistory,
            { stage: nextStageId, user: currentUser, date: actionDate },
          ],
        };
      }
      return item;
    });

    const orderRef = doc(db, "orders", orderToUpdate.firebaseId);
    await updateDoc(orderRef, { items: updatedItems });

    setBatchEdit(null);
    const stageConfig = STAGES[nextStageId];
    const nextLabel = stageConfig ? stageConfig.label : "NUEVO ESTADO";
    sendNotification(
      "Estatus Actualizado",
      `Orden #${orderToUpdate.orderNum} -> ${nextLabel}`
    );
  };

  // --- BORRAR (EN NUBE) ---
  const deleteOrder = async (id) => {
    const canDelete = currentUser === "MANAGER" || currentUser === "SUPERVISOR";
    if (!canDelete) return;
    if (window.confirm("¿ELIMINAR ORDEN DE LA BASE DE DATOS?")) {
      const ord = orders.find((o) => o.id === id);
      if (ord) {
        await deleteDoc(doc(db, "orders", ord.firebaseId));
        sendNotification(
          "Orden Eliminada",
          "Borrada permanentemente de la nube"
        );
      }
    }
  };

  // ... (RESTO DE FUNCIONES IGUALES: FILTROS, REPORTES, UI) ...
  const getFilteredOrders = () => {
    return orders.filter((order) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        order.orderNum.toLowerCase().includes(searchLower) ||
        (order.client && order.client.toLowerCase().includes(searchLower));
      if (!matchesSearch) return false;
      if (specialFilter === "RK" && !order.rk) return false;
      if (specialFilter === "RS" && !order.rs) return false;
      if (filter === "ALL") return true;
      return order.items.some((item) => item.status === filter.toLowerCase());
    });
  };

  const getGroupedOrderItems = (order) => {
    const groups = {};
    order.items.forEach((item) => {
      if (filter !== "ALL" && item.status !== filter.toLowerCase()) return;
      const status = item.status;
      if (!groups[status])
        groups[status] = {
          status,
          board: item.board,
          sqf: item.sqf,
          date: item.dates[status],
          updatedBy: item.updatedBy,
          itemIds: [],
        };
      groups[status].itemIds.push(item.id);
    });
    return Object.values(groups);
  };

  const getAggregatedReport = () => {
    const report = {};
    const months = [
      "ENERO",
      "FEBRERO",
      "MARZO",
      "ABRIL",
      "MAYO",
      "JUNIO",
      "JULIO",
      "AGOSTO",
      "SEPTIEMBRE",
      "OCTUBRE",
      "NOVIEMBRE",
      "DICIEMBRE",
    ];
    orders.forEach((order) => {
      const batches = {};
      order.items.forEach((item) => {
        const status = item.status;
        const batchId = `${status}-${item.board}-${item.sqf}-${item.dates[status]}`;
        if (!batches[batchId])
          batches[batchId] = {
            board: item.board,
            sqf: item.sqf,
            date: item.dates[status],
            count: 0,
          };
        batches[batchId].count++;
      });
      Object.values(batches).forEach((batch) => {
        if (batch.date) {
          const d = new Date(batch.date);
          const m = months[d.getMonth()];
          if (!report[m]) report[m] = { board: 0, sqf: 0, pz: 0 };
          report[m].pz += batch.count;
          const bVal = parseFloat(batch.board);
          if (!isNaN(bVal)) report[m].board += bVal;
          const sqfVal = parseFloat(batch.sqf);
          if (!isNaN(sqfVal)) report[m].sqf += sqfVal;
        }
      });
    });
    return report;
  };

  const getCount = (id) => {
    let count = 0;
    orders.forEach((o) =>
      o.items.forEach((i) => {
        if (i.status === id) count++;
      })
    );
    return count;
  };

  const OrderSemaphore = ({ items }) => {
    const statusSet = new Set(items.map((i) => i.status));
    return (
      <div className="flex gap-1 mt-1 justify-center bg-slate-100 p-1 rounded-full w-fit mx-auto">
        {Object.values(STAGES).map((stage) => (
          <div
            key={stage.id}
            className={`w-2 h-2 rounded-full ${
              statusSet.has(stage.id) ? stage.dotColor : "bg-slate-300"
            }`}
            title={stage.label}
          />
        ))}
      </div>
    );
  };

  const totalRK = orders.filter((o) => o.rk).length;
  const totalRS = orders.filter((o) => o.rs).length;
  const reportData = getAggregatedReport();
  let totalGrandBoard = 0;
  let totalGrandPZ = 0;
  let totalGrandSQF = 0;
  Object.values(reportData).forEach((val) => {
    totalGrandBoard += val.board;
    totalGrandPZ += val.pz;
    totalGrandSQF += val.sqf;
  });

  const visibleOrders = getFilteredOrders();
  const isAdmin = currentUser === "MANAGER" || currentUser === "SUPERVISOR";

  if (!currentUser) {
    return (
      <div className="h-screen w-screen bg-slate-200 flex items-center justify-center p-4 fixed top-0 left-0 z-50">
        <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-sm text-center">
          {loginStep === 0 ? (
            <>
              <div className="bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <User size={32} className="text-white" />
              </div>
              <h2 className="text-xl font-black text-slate-800 mb-2 uppercase">
                Bienvenido
              </h2>
              <div className="space-y-3">
                {USERS.map((user) => (
                  <button
                    key={user.name}
                    onClick={() => initiateLogin(user)}
                    className={`w-full py-3 border rounded-lg font-bold text-sm transition-all shadow-sm ${
                      user.name === "MANAGER"
                        ? "bg-slate-900 text-white hover:bg-black"
                        : user.name === "SUPERVISOR"
                        ? "bg-slate-100 border-slate-300 text-slate-800"
                        : "bg-white border-slate-200 text-slate-600 hover:border-blue-500 hover:text-blue-600"
                    }`}
                  >
                    {user.name}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock size={32} className="text-white" />
              </div>
              <h2 className="text-lg font-bold text-slate-800 mb-1">
                {tempUser.name}
              </h2>
              <p className="text-xs text-slate-400 mb-6">
                Contraseña de 6 dígitos
              </p>
              <form onSubmit={validatePassword}>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  className="w-full text-center text-2xl tracking-[0.5em] font-bold border-2 border-slate-300 rounded-lg p-3 mb-4 focus:border-blue-500 focus:outline-none"
                  placeholder="••••••"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  autoFocus
                />
                {errorMsg && (
                  <p className="text-red-500 text-xs font-bold mb-4">
                    {errorMsg}
                  </p>
                )}
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg mb-3 shadow-lg"
                >
                  ENTRAR
                </button>
                <button
                  type="button"
                  onClick={() => setLoginStep(0)}
                  className="text-slate-400 text-xs hover:text-slate-600 underline"
                >
                  Volver
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-100 overflow-hidden font-sans text-slate-800">
      <style>{`#__next-prerender-indicator, .sc-bdVaJa, button[title="Open Sandbox"] { display: none !important; } body { overscroll-behavior: none; }`}</style>

      {notification && (
        <div className="fixed top-4 left-4 right-4 bg-slate-900 text-white p-4 rounded-xl shadow-2xl z-[100] animate-in slide-in-from-top-10 duration-300 flex items-center gap-3 border-l-4 border-green-500">
          <Bell className="text-green-400" size={24} />
          <div>
            <h4 className="font-bold text-sm">{notification.title}</h4>
            <p className="text-xs opacity-90">{notification.body}</p>
          </div>
        </div>
      )}

      <div className="flex-none z-40 bg-white shadow-md">
        <div className="flex justify-between items-center p-2 px-3 bg-slate-800 text-white">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            {currentUser}
          </div>
          <button
            onClick={handleLogout}
            className="text-[10px] bg-slate-700 hover:bg-red-600 px-2 py-1 rounded flex items-center gap-1 transition-colors"
          >
            <LogOut size={10} />
          </button>
        </div>
        <div className="p-2 bg-slate-700 border-t border-slate-600 flex gap-2">
          {(specialFilter !== "ALL" || searchTerm !== "") && (
            <button
              onClick={() => {
                setSpecialFilter("ALL");
                setSearchTerm("");
              }}
              className="px-2 bg-red-500 text-white rounded flex items-center"
            >
              X
            </button>
          )}
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-2.5 text-slate-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Buscar..."
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-600 rounded text-sm text-white focus:outline-none focus:border-blue-500 placeholder-slate-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="bg-slate-100 p-2 border-b border-slate-300">
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => setFilter("ALL")}
              className={`p-1 rounded text-[10px] font-bold uppercase flex flex-col items-center justify-center border ${
                filter === "ALL"
                  ? "bg-slate-800 text-white border-slate-900"
                  : "bg-white text-slate-500 border-slate-300"
              }`}
            >
              {" "}
              <ClipboardList size={12} /> TODOS{" "}
            </button>
            {Object.values(STAGES).map((stage) => (
              <button
                key={stage.id}
                onClick={() => setFilter(stage.id.toUpperCase())}
                className={`p-1 rounded text-[10px] font-bold uppercase flex flex-col items-center justify-center border shadow-sm ${
                  stage.color
                } ${
                  filter === stage.id.toUpperCase()
                    ? "ring-2 ring-offset-2 ring-slate-500 scale-95"
                    : "opacity-80 hover:opacity-100"
                }`}
              >
                {stage.label}
                <span className="bg-white/20 px-1.5 rounded-full text-[9px] min-w-[16px] text-center mt-0.5">
                  {getCount(stage.id)}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 pb-24">
        {filter === "ALL" && (
          <div className="bg-white p-3 rounded-lg shadow-sm mb-4 border-l-4 border-blue-600">
            <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">
              NUEVA ORDEN
            </h3>
            <form onSubmit={addOrder} className="flex flex-col gap-2">
              <div className="flex gap-2 items-center">
                <input
                  className="w-20 p-1.5 bg-slate-50 border rounded text-sm font-bold"
                  placeholder="# Ord"
                  value={newOrderNum}
                  onChange={(e) => setNewOrderNum(e.target.value)}
                />
                <div className="flex-1 flex gap-1">
                  <select
                    className="flex-1 p-1.5 bg-slate-50 border rounded text-sm font-bold text-slate-700 outline-none"
                    value={newClient}
                    onChange={(e) => setNewClient(e.target.value)}
                  >
                    {clientList.map((client) => (
                      <option key={client} value={client}>
                        {client}
                      </option>
                    ))}
                  </select>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={handleAddClient}
                      className="bg-slate-200 hover:bg-blue-200 text-blue-800 p-1.5 rounded"
                    >
                      <Plus size={16} />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex gap-4 items-center bg-slate-50 p-1.5 rounded border border-slate-100">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-blue-600"
                    checked={isRK}
                    onChange={(e) => setIsRK(e.target.checked)}
                  />{" "}
                  RK
                </label>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-blue-600"
                    checked={isRS}
                    onChange={(e) => setIsRS(e.target.checked)}
                  />{" "}
                  RS
                </label>
              </div>
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-5">
                  <input
                    className="w-full p-1.5 bg-slate-50 border rounded text-xs text-center font-bold"
                    placeholder="BOARD"
                    value={newBoard}
                    onChange={(e) => setNewBoard(e.target.value)}
                  />
                </div>
                <div className="col-span-4">
                  <input
                    className="w-full p-1.5 bg-slate-50 border rounded text-xs text-center font-bold"
                    placeholder="SQF"
                    value={newSqf}
                    onChange={(e) => setNewSqf(e.target.value)}
                  />
                </div>
                <div className="col-span-3">
                  <input
                    type="number"
                    className="w-full p-1.5 bg-slate-50 border rounded text-xs text-center font-bold"
                    placeholder="QTY"
                    value={newQty}
                    onChange={(e) => setNewQty(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2 items-center">
                <span className="text-xs font-bold text-slate-400">Fecha:</span>
                <input
                  type="date"
                  className="flex-1 p-1.5 border rounded text-sm"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                />
                <button className="bg-blue-600 text-white p-1.5 rounded shadow font-bold">
                  <Plus />
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border overflow-hidden mb-6">
          <div className="grid grid-cols-12 gap-1 bg-slate-800 text-white text-[10px] uppercase font-bold p-2 text-center items-center">
            <div className="col-span-3">ORDEN</div>
            <div className="col-span-2">BD/SQF</div>
            <div className="col-span-3">FECHA</div>
            <div className="col-span-4">ESTADO</div>
          </div>
          <div className="divide-y divide-slate-100">
            {visibleOrders.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-xs">
                Cargando datos o vacío...
              </div>
            )}
            {visibleOrders.map((order) => {
              const groups = getGroupedOrderItems(order);
              if (groups.length === 0) return null;
              return groups.map((group, index) => {
                const safeKey = group.status
                  ? group.status.toUpperCase()
                  : "CUT";
                const config = STAGES[safeKey] || STAGES.CUT;
                const isShipped = group.status === "vacum";
                const isDelayed =
                  group.status === "cut" && checkOverdue(group.date);
                return (
                  <div
                    key={`${order.id}-${group.status}-${index}`}
                    className="grid grid-cols-12 gap-1 p-3 items-center text-sm hover:bg-slate-50"
                  >
                    <div className="col-span-3 text-center flex flex-col items-center justify-center">
                      <div className="flex items-center gap-1 flex-wrap justify-center">
                        {order.rk && (
                          <button
                            onClick={() => setSpecialFilter("RK")}
                            className="text-[9px] bg-red-100 text-red-800 px-1 rounded font-bold border border-red-200"
                          >
                            RK
                          </button>
                        )}
                        {order.rs && (
                          <button
                            onClick={() => setSpecialFilter("RS")}
                            className="text-[9px] bg-blue-100 text-blue-800 px-1 rounded font-bold border border-blue-200"
                          >
                            RS
                          </button>
                        )}
                        <span className="font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded text-xs">
                          #{order.orderNum}
                        </span>
                      </div>
                      <span className="text-[9px] text-slate-500 font-bold uppercase truncate max-w-full px-1 mt-0.5">
                        {order.client}
                      </span>
                      <OrderSemaphore items={order.items} />
                      <div className="flex gap-2 mt-1">
                        {index === 0 && filter === "ALL" && isAdmin && (
                          <>
                            <button
                              onClick={() => openEditModal(order)}
                              className="text-slate-400 hover:text-blue-500"
                            >
                              <Pencil size={12} />
                            </button>
                            <button
                              onClick={() => deleteOrder(order.id)}
                              className="text-slate-400 hover:text-red-500"
                            >
                              <Trash2 size={12} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="col-span-2 text-center flex flex-col leading-tight">
                      <span className="font-bold text-slate-800 text-xs">
                        B: {group.board}
                      </span>
                      {group.sqf && (
                        <span className="font-bold text-slate-500 text-[10px]">
                          {group.sqf}
                        </span>
                      )}
                      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-1 rounded mt-1">
                        {group.itemIds.length} PZ
                      </span>
                    </div>
                    <div className="col-span-3 text-center text-xs text-slate-600 flex flex-col justify-center">
                      <div className="flex items-center justify-center gap-1">
                        <span
                          className={`font-medium ${
                            isDelayed ? "text-red-600 font-bold" : ""
                          }`}
                        >
                          {group.date || "-"}
                        </span>
                        {isDelayed && (
                          <AlertTriangle
                            size={12}
                            className="text-red-600 animate-pulse"
                          />
                        )}
                      </div>
                      <span className="text-[9px] uppercase text-slate-400 mt-0.5 border border-slate-100 bg-slate-50 px-1 rounded-sm inline-block mx-auto">
                        {group.updatedBy || "N/A"}
                      </span>
                    </div>
                    <div className="col-span-4 text-center">
                      {!isShipped ? (
                        <button
                          onClick={() =>
                            openBatchModal(order.id, group.itemIds, config.id)
                          }
                          className={`${config.btnColor} w-full text-white text-[10px] font-bold py-2 rounded shadow-sm flex justify-center items-center gap-1 active:scale-95 transition`}
                        >
                          MOVER <Settings size={10} />
                        </button>
                      ) : (
                        <div className="bg-green-100 text-green-700 py-1 rounded text-[10px] font-bold border border-green-200 flex justify-center items-center gap-1">
                          <CheckCircle size={10} /> ENVIADA
                        </div>
                      )}
                    </div>
                  </div>
                );
              });
            })}
          </div>
        </div>

        {filter === "ALL" && (
          <div className="mb-4 border-2 border-black bg-white">
            <div className="bg-white text-black font-bold text-center border-b-2 border-black p-2 text-sm uppercase">
              REPORTE TOTAL MES
            </div>
            <table className="w-full text-center text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-black font-bold text-xs bg-slate-50">
                  <th className="border-r-2 border-black p-2 w-1/4">MES</th>
                  <th className="border-r-2 border-black p-2 w-1/4">BOARD</th>
                  <th className="border-r-2 border-black p-2 w-1/4">SQF</th>
                  <th className="p-2 w-1/4">PZ</th>
                </tr>
              </thead>
              <tbody className="text-xs font-bold">
                {Object.entries(reportData).map(([month, data]) => (
                  <tr key={month} className="border-b border-black">
                    <td className="border-r-2 border-black p-2">{month}</td>
                    <td className="border-r-2 border-black p-2">
                      {data.board}
                    </td>
                    <td className="border-r-2 border-black p-2">{data.sqf}</td>
                    <td className="p-2">{data.pz}</td>
                  </tr>
                ))}
                {Object.keys(reportData).length > 0 ? (
                  <tr className="bg-slate-100">
                    <td className="border-r-2 border-black p-2">TOTAL</td>
                    <td className="border-r-2 border-black p-2 text-blue-800 text-base">
                      {totalGrandBoard}
                    </td>
                    <td className="border-r-2 border-black p-2 text-blue-800 text-base">
                      {totalGrandSQF}
                    </td>
                    <td className="p-2 text-blue-800 text-base">
                      {totalGrandPZ}
                    </td>
                  </tr>
                ) : (
                  <tr>
                    <td
                      colSpan="4"
                      className="p-4 text-slate-400 font-normal italic"
                    >
                      No hay datos
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex-none fixed bottom-0 w-full bg-slate-900 border-t border-slate-700 z-50 p-0">
        <div className="flex h-14">
          <button
            onClick={() =>
              setSpecialFilter(specialFilter === "RK" ? "ALL" : "RK")
            }
            className={`flex-1 flex flex-col justify-center items-center transition active:scale-95 ${
              specialFilter === "RK"
                ? "bg-red-700 border-t-4 border-red-400"
                : "hover:bg-slate-800"
            }`}
          >
            <span className="text-xl font-black text-white leading-none">
              {totalRK}
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              {specialFilter !== "RK" && (
                <div className="bg-red-500 w-1.5 h-1.5 rounded-full animate-pulse"></div>
              )}
              <span className="text-[10px] font-bold text-slate-200 tracking-widest">
                RK ORDERS
              </span>
            </div>
          </button>
          <div className="w-px bg-slate-700 h-full"></div>
          <button
            onClick={() =>
              setSpecialFilter(specialFilter === "RS" ? "ALL" : "RS")
            }
            className={`flex-1 flex flex-col justify-center items-center transition active:scale-95 ${
              specialFilter === "RS"
                ? "bg-blue-700 border-t-4 border-blue-400"
                : "hover:bg-slate-800"
            }`}
          >
            <span className="text-xl font-black text-white leading-none">
              {totalRS}
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              {specialFilter !== "RS" && (
                <div className="bg-blue-500 w-1.5 h-1.5 rounded-full animate-pulse"></div>
              )}
              <span className="text-[10px] font-bold text-slate-200 tracking-widest">
                RS ORDERS
              </span>
            </div>
          </button>
        </div>
      </div>

      {batchEdit && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-5 w-full max-w-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
              <Settings className="text-blue-600" /> MOVER A:
            </h3>
            <div className="mb-4">
              <label className="text-xs font-bold text-slate-500 block mb-1">
                ELEGIR NUEVO ESTADO:
              </label>
              <select
                className="w-full p-3 border-2 border-blue-100 rounded-lg font-bold text-slate-700 focus:border-blue-500 outline-none"
                value={selectedDestination}
                onChange={(e) => setSelectedDestination(e.target.value)}
              >
                {DESTINATIONS.map((st) => (
                  <option
                    key={st.id}
                    value={st.id}
                    disabled={st.id === batchEdit.currentStatusId}
                  >
                    {st.label}
                  </option>
                ))}
              </select>
            </div>
            <input
              type="date"
              className="w-full p-3 border rounded mb-6 text-lg font-bold text-center bg-white"
              value={actionDate}
              onChange={(e) => setActionDate(e.target.value)}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setBatchEdit(null)}
                className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded"
              >
                CANCELAR
              </button>
              <button
                onClick={confirmBatchAdvance}
                className="flex-1 py-3 bg-blue-600 text-white font-bold rounded shadow hover:bg-blue-700"
              >
                CONFIRMAR
              </button>
            </div>
          </div>
        </div>
      )}

      {editOrderModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm animate-in zoom-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <Pencil size={18} /> EDITAR ORDEN
              </h3>
              <button onClick={() => setEditOrderModal(null)}>
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-500">
                  ORDEN #
                </label>
                <input
                  className="w-full p-2 border rounded font-bold bg-slate-50"
                  value={editOrderModal.orderNum}
                  onChange={(e) =>
                    setEditOrderModal({
                      ...editOrderModal,
                      orderNum: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500">
                  CLIENTE
                </label>
                <div className="flex gap-1">
                  <select
                    className="flex-1 p-2 border rounded font-bold"
                    value={editOrderModal.client}
                    onChange={(e) =>
                      setEditOrderModal({
                        ...editOrderModal,
                        client: e.target.value,
                      })
                    }
                  >
                    {clientList.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAddClient}
                    className="bg-slate-200 text-blue-800 p-2 rounded"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs font-bold text-slate-500">
                    BOARD
                  </label>
                  <input
                    className="w-full p-2 border rounded"
                    value={editOrderModal.board}
                    onChange={(e) =>
                      setEditOrderModal({
                        ...editOrderModal,
                        board: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-bold text-slate-500">
                    SQF
                  </label>
                  <input
                    className="w-full p-2 border rounded"
                    value={editOrderModal.sqf}
                    onChange={(e) =>
                      setEditOrderModal({
                        ...editOrderModal,
                        sqf: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="flex gap-4 items-center bg-slate-50 p-2 rounded border border-slate-100 mt-2">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-blue-600"
                    checked={editOrderModal.rk}
                    onChange={(e) =>
                      setEditOrderModal({
                        ...editOrderModal,
                        rk: e.target.checked,
                      })
                    }
                  />{" "}
                  RK
                </label>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-blue-600"
                    checked={editOrderModal.rs}
                    onChange={(e) =>
                      setEditOrderModal({
                        ...editOrderModal,
                        rs: e.target.checked,
                      })
                    }
                  />{" "}
                  RS
                </label>
              </div>
            </div>
            <button
              onClick={saveEditedOrder}
              className="w-full mt-6 bg-blue-600 text-white font-bold py-3 rounded shadow flex items-center justify-center gap-2"
            >
              <Save size={16} /> GUARDAR CAMBIOS
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
