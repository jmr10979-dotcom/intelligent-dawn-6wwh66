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
  KeyRound,
  Settings,
  Search,
  AlertTriangle,
} from "lucide-react";

// --- CONFIGURACIÓN DE ESTADOS ---
const STAGES = {
  CUT: {
    id: "cut",
    label: "CUT",
    color: "bg-white border-l-4 border-slate-400",
    btnColor: "bg-slate-800",
  },
  SANDING: {
    id: "sanding",
    label: "SANDING",
    color: "bg-yellow-50 border-l-4 border-yellow-400",
    btnColor: "bg-yellow-600",
  },
  MACHINE: {
    id: "machine",
    label: "MACHINE",
    color: "bg-orange-50 border-l-4 border-orange-400",
    btnColor: "bg-orange-600",
  },
  HOLE: {
    id: "hole",
    label: "HOLE",
    color: "bg-purple-50 border-l-4 border-purple-400",
    btnColor: "bg-purple-600",
  },
  READY: {
    id: "ready",
    label: "FINAL",
    color: "bg-blue-50 border-l-4 border-blue-400",
    btnColor: "bg-blue-600",
  },
  VACUM: {
    id: "vacum",
    label: "ENVIADA",
    color: "bg-green-50 border-l-4 border-green-500",
    btnColor: "bg-green-600",
  },
};

const DESTINATIONS = Object.values(STAGES);

// --- USUARIOS ---
const USERS = [
  { name: "MANAGER", pass: "1973" },
  { name: "SUPERVISOR", pass: "123456" },
  { name: "CNC T1", pass: "123456" },
  { name: "CNC T2", pass: "123456" },
  { name: "SANDING T1", pass: "123456" },
  { name: "SANDING T2", pass: "123456" },
];

const App = () => {
  // --- CARGA DE DATOS ---
  // Cambiamos ID a v15 para asegurar limpieza
  const [orders, setOrders] = useState(() => {
    try {
      const saved = localStorage.getItem("prod_v15_final_tweaks");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [currentUser, setCurrentUser] = useState(null);

  // Login States
  const [loginStep, setLoginStep] = useState(0);
  const [tempUser, setTempUser] = useState(null);
  const [pinInput, setPinInput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Filtros
  const [filter, setFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Inputs Nueva Orden
  const [newOrderNum, setNewOrderNum] = useState("");
  const [newClient, setNewClient] = useState("");
  const [newQty, setNewQty] = useState("");
  const [newBoard, setNewBoard] = useState("");
  const [newDate, setNewDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // Checkboxes
  const [isRK, setIsRK] = useState(false);
  const [isRS, setIsRS] = useState(false);

  // Batch Editing
  const [batchEdit, setBatchEdit] = useState(null);
  const [actionDate, setActionDate] = useState("");
  const [selectedDestination, setSelectedDestination] = useState("");

  useEffect(() => {
    localStorage.setItem("prod_v15_final_tweaks", JSON.stringify(orders));
  }, [orders]);

  // --- LOGIN ---
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

  // --- LÓGICA DE APP ---

  const addOrder = (e) => {
    e.preventDefault();
    if (!newOrderNum || !newQty) return;

    // 1. VALIDACIÓN DE DUPLICADOS
    const exists = orders.some(
      (o) => o.orderNum.toString().trim() === newOrderNum.toString().trim()
    );
    if (exists) {
      alert(`ERROR: La Orden #${newOrderNum} YA EXISTE. No se puede duplicar.`);
      return;
    }

    const newOrder = {
      id: Date.now(),
      orderNum: newOrderNum,
      client: newClient,
      createdBy: currentUser,
      rk: isRK,
      rs: isRS,
      items: Array.from({ length: Number(newQty) }).map((_, i) => ({
        id: `${Date.now()}-${i}`,
        board: newBoard,
        status: "cut",
        updatedBy: currentUser,
        dates: { cut: newDate },
        history: [{ stage: "cut", user: currentUser, date: newDate }],
      })),
    };

    setOrders([newOrder, ...orders]);
    setNewOrderNum("");
    setNewClient("");
    setNewBoard("");
    setNewQty("");
    setIsRK(false);
    setIsRS(false);
  };

  const openBatchModal = (orderId, itemIds, currentStatusId) => {
    let defaultNext = "sanding";
    setBatchEdit({ orderId, itemIds, currentStatusId });
    setSelectedDestination(defaultNext);
    setActionDate(new Date().toISOString().split("T")[0]);
  };

  const confirmBatchAdvance = () => {
    if (!batchEdit || !selectedDestination) return;
    const { orderId, itemIds } = batchEdit;
    const nextStageId = selectedDestination;

    const updatedOrders = orders.map((o) => {
      if (o.id !== orderId) return o;
      return {
        ...o,
        items: o.items.map((item) => {
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
        }),
      };
    });

    setOrders(updatedOrders);
    setBatchEdit(null);
  };

  const deleteOrder = (id) => {
    // 2. VALIDACIÓN DE BORRADO: Solo Manager y Supervisor
    const canDelete = currentUser === "MANAGER" || currentUser === "SUPERVISOR";

    if (!canDelete) return; // No debería llegar aquí porque el botón se oculta, pero por seguridad

    if (
      window.confirm("¿ELIMINAR ORDEN COMPLETA? Esta acción es irreversible.")
    ) {
      setOrders(orders.filter((o) => o.id !== id));
    }
  };

  const getFilteredOrders = () => {
    return orders.filter((order) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        order.orderNum.toLowerCase().includes(searchLower) ||
        (order.client && order.client.toLowerCase().includes(searchLower));

      if (!matchesSearch) return false;
      if (filter === "ALL") return true;
      return order.items.some((item) => item.status === filter.toLowerCase());
    });
  };

  const getGroupedOrderItems = (order) => {
    const groups = {};
    order.items.forEach((item) => {
      if (filter !== "ALL" && item.status !== filter.toLowerCase()) return;

      const status = item.status;
      if (!groups[status]) {
        groups[status] = {
          status: status,
          board: item.board,
          date: item.dates[status],
          updatedBy: item.updatedBy,
          itemIds: [],
        };
      }
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
        const batchId = `${status}-${item.board}-${item.dates[status]}`;
        if (!batches[batchId]) {
          batches[batchId] = {
            board: item.board,
            date: item.dates[status],
            count: 0,
          };
        }
        batches[batchId].count++;
      });

      Object.values(batches).forEach((batch) => {
        if (batch.date) {
          const d = new Date(batch.date);
          const m = months[d.getMonth()];
          if (!report[m]) report[m] = { board: 0, pz: 0 };
          report[m].pz += batch.count;
          const bVal = parseFloat(batch.board);
          if (!isNaN(bVal)) report[m].board += bVal;
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

  // Cálculos para la barra inferior RK/RS
  const totalRK = orders.filter((o) => o.rk).length;
  const totalRS = orders.filter((o) => o.rs).length;

  const reportData = getAggregatedReport();
  let totalGrandBoard = 0;
  let totalGrandPZ = 0;
  Object.values(reportData).forEach((val) => {
    totalGrandBoard += val.board;
    totalGrandPZ += val.pz;
  });

  // --- VISTA LOGIN ---
  if (!currentUser && loginStep === 0) {
    return (
      <div className="min-h-screen bg-slate-200 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-sm text-center">
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
        </div>
      </div>
    );
  }

  if (!currentUser && loginStep === 1) {
    return (
      <div className="min-h-screen bg-slate-200 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-sm text-center">
          <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock size={32} className="text-white" />
          </div>
          <h2 className="text-lg font-bold text-slate-800 mb-1">
            {tempUser.name}
          </h2>
          <p className="text-xs text-slate-400 mb-6">Contraseña de 6 dígitos</p>
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
              <p className="text-red-500 text-xs font-bold mb-4">{errorMsg}</p>
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
        </div>
      </div>
    );
  }

  const visibleOrders = getFilteredOrders();

  // --- MAIN APP ---
  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 pb-20">
      {/* HEADER + BUSCADOR */}
      <div className="sticky top-0 z-40 bg-white shadow-md">
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

        {/* BUSCADOR */}
        <div className="p-2 bg-slate-700 border-t border-slate-600">
          <div className="relative">
            <Search
              className="absolute left-3 top-2.5 text-slate-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Buscar Orden..."
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-600 rounded text-sm text-white focus:outline-none focus:border-blue-500 placeholder-slate-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* MENU FILTROS ARRIBA (GRID DE 2 LINEAS) */}
        <div className="bg-slate-100 p-2 border-b border-slate-300">
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => setFilter("ALL")}
              className={`p-1 rounded text-[10px] font-bold uppercase flex flex-col items-center justify-center border ${
                filter === "ALL"
                  ? "bg-slate-800 text-white border-slate-800"
                  : "bg-white text-slate-500 border-slate-300"
              }`}
            >
              <ClipboardList size={12} /> TODOS
            </button>
            {Object.values(STAGES).map((stage) => (
              <button
                key={stage.id}
                onClick={() => setFilter(stage.id.toUpperCase())}
                className={`p-1 rounded text-[10px] font-bold uppercase flex flex-col items-center justify-center border ${
                  filter === stage.id.toUpperCase()
                    ? `bg-white border-blue-600 text-blue-700`
                    : "bg-white border-slate-300 text-slate-500"
                }`}
              >
                {stage.label}
                <span className="bg-slate-200 px-1 rounded-full text-[9px] text-black min-w-[16px] text-center mt-0.5">
                  {getCount(stage.id)}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-3">
        {/* FORMULARIO */}
        {filter === "ALL" && (
          <div className="bg-white p-4 rounded-lg shadow-sm mb-6 border-l-4 border-blue-600">
            <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">
              NUEVA ORDEN
            </h3>
            <form onSubmit={addOrder} className="flex flex-col gap-3">
              <div className="flex gap-2">
                <input
                  className="w-20 p-2 bg-slate-50 border rounded text-sm font-bold"
                  placeholder="# Ord"
                  value={newOrderNum}
                  onChange={(e) => setNewOrderNum(e.target.value)}
                />
                <input
                  className="flex-1 p-2 bg-slate-50 border rounded text-sm"
                  placeholder="Cliente"
                  value={newClient}
                  onChange={(e) => setNewClient(e.target.value)}
                />
              </div>

              {/* CHECKBOXES RK y RS */}
              <div className="flex gap-4 items-center bg-slate-50 p-2 rounded border border-slate-100">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-blue-600"
                    checked={isRK}
                    onChange={(e) => setIsRK(e.target.checked)}
                  />
                  RK
                </label>
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-blue-600"
                    checked={isRS}
                    onChange={(e) => setIsRS(e.target.checked)}
                  />
                  RS
                </label>
              </div>

              <div className="flex gap-2">
                <input
                  className="flex-1 p-2 bg-slate-50 border rounded text-sm"
                  placeholder="BOARD (Ej: 3)"
                  value={newBoard}
                  onChange={(e) => setNewBoard(e.target.value)}
                />
                <input
                  type="number"
                  className="w-20 p-2 bg-slate-50 border rounded text-sm text-center"
                  placeholder="QTY"
                  value={newQty}
                  onChange={(e) => setNewQty(e.target.value)}
                />
              </div>
              <div className="flex gap-2 items-center">
                <span className="text-xs font-bold text-slate-400">Fecha:</span>
                <input
                  type="date"
                  className="flex-1 p-2 border rounded text-sm"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                />
                <button className="bg-blue-600 text-white p-2 rounded shadow font-bold">
                  <Plus />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* LISTADO */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="grid grid-cols-12 gap-1 bg-slate-800 text-white text-[10px] uppercase font-bold p-2 text-center items-center">
            <div className="col-span-3">ORDEN</div>
            <div className="col-span-2">BOARD/PZ</div>
            <div className="col-span-3">FECHA</div>
            <div className="col-span-4">ESTADO</div>
          </div>

          <div className="divide-y divide-slate-100">
            {visibleOrders.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-xs">
                {searchTerm
                  ? "No se encontraron resultados."
                  : "No hay datos registrados."}
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

                return (
                  <div
                    key={`${order.id}-${group.status}-${index}`}
                    className="grid grid-cols-12 gap-1 p-3 items-center text-sm hover:bg-slate-50"
                  >
                    <div className="col-span-3 text-center flex flex-col items-center justify-center">
                      <span className="font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded text-xs">
                        #{order.orderNum}
                      </span>
                      {/* INDICADORES RK / RS */}
                      <div className="flex gap-1 mt-1 justify-center w-full">
                        {order.rk && (
                          <span className="text-[9px] bg-red-100 text-red-800 px-1 rounded font-bold border border-red-200">
                            RK
                          </span>
                        )}
                        {order.rs && (
                          <span className="text-[9px] bg-blue-100 text-blue-800 px-1 rounded font-bold border border-blue-200">
                            RS
                          </span>
                        )}
                      </div>

                      {/* SOLO BORRAN MANAGER O SUPERVISOR */}
                      {index === 0 &&
                        filter === "ALL" &&
                        (currentUser === "MANAGER" ||
                          currentUser === "SUPERVISOR") && (
                          <button
                            onClick={() => deleteOrder(order.id)}
                            className="mt-1 text-red-300 hover:text-red-500"
                          >
                            <Trash2 size={10} />
                          </button>
                        )}
                    </div>
                    <div className="col-span-2 text-center flex flex-col leading-tight">
                      <span className="font-bold text-slate-800 text-xs">
                        {group.board}
                      </span>
                      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-1 rounded mt-1">
                        {group.itemIds.length} PZ
                      </span>
                    </div>
                    <div className="col-span-3 text-center text-xs text-slate-600 flex flex-col justify-center">
                      <span className="font-medium">{group.date || "-"}</span>
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

        {/* REPORTE */}
        {filter === "ALL" && (
          <div className="mt-10 mb-20 border-2 border-black bg-white">
            <div className="bg-white text-black font-bold text-center border-b-2 border-black p-2 text-sm uppercase">
              REPORTE TOTAL MES
            </div>
            <table className="w-full text-center text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-black font-bold text-xs bg-slate-50">
                  <th className="border-r-2 border-black p-2 w-1/3">MES</th>
                  <th className="border-r-2 border-black p-2 w-1/3">BOARD</th>
                  <th className="p-2 w-1/3">PZ</th>
                </tr>
              </thead>
              <tbody className="text-xs font-bold">
                {Object.entries(reportData).map(([month, data]) => (
                  <tr key={month} className="border-b border-black">
                    <td className="border-r-2 border-black p-2">{month}</td>
                    <td className="border-r-2 border-black p-2">
                      {data.board}
                    </td>
                    <td className="p-2">{data.pz}</td>
                  </tr>
                ))}
                {Object.keys(reportData).length > 0 ? (
                  <tr className="bg-slate-100">
                    <td className="border-r-2 border-black p-2">TOTAL</td>
                    <td className="border-r-2 border-black p-2 text-blue-800 text-base">
                      {totalGrandBoard}
                    </td>
                    <td className="p-2 text-blue-800 text-base">
                      {totalGrandPZ}
                    </td>
                  </tr>
                ) : (
                  <tr>
                    <td
                      colSpan="3"
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

      {/* --- BARRA FIJA INFERIOR: RESUMEN RK / RS --- */}
      <div className="fixed bottom-0 w-full bg-slate-900 border-t border-slate-700 z-50 p-2">
        <div className="max-w-4xl mx-auto flex justify-around items-center text-white">
          <div className="flex items-center gap-2">
            <div className="bg-red-500 w-3 h-3 rounded-full animate-pulse"></div>
            <span className="text-xs font-bold text-slate-400">RK TOTAL:</span>
            <span className="text-sm font-black text-white">{totalRK}</span>
          </div>
          <div className="w-px h-6 bg-slate-700"></div>
          <div className="flex items-center gap-2">
            <div className="bg-blue-500 w-3 h-3 rounded-full animate-pulse"></div>
            <span className="text-xs font-bold text-slate-400">RS TOTAL:</span>
            <span className="text-sm font-black text-white">{totalRS}</span>
          </div>
        </div>
      </div>

      {/* MODAL */}
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
    </div>
  );
};

export default App;
