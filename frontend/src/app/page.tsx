"use client";

import { useSession, signOut } from "next-auth/react";
import useSWR, { mutate } from "swr";
import { fetchWithAuth } from "@/lib/fetch";
import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import DitheredPlanet from "@/components/DitheredPlanet";
import Modal from "@/components/Modal";

const fetcher = (url: string) => fetchWithAuth(url);

export default function Dashboard() {
  const { data: session, status } = useSession();

  const [authMode, setAuthMode] = useState<"none" | "login" | "register">("none");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("PRIORITY");
  const [showOldModal, setShowOldModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [oldDaysThreshold, setOldDaysThreshold] = useState(7);
  useEffect(() => {
    const saved = localStorage.getItem('oldDaysThreshold');
    if (saved) setOldDaysThreshold(Number(saved));
  }, []);
  const updateThreshold = (val: number) => {
    setOldDaysThreshold(val);
    localStorage.setItem('oldDaysThreshold', val.toString());
  };
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");

  const queryParams = new URLSearchParams();
  if (search) queryParams.append("search", search);
  if (priorityFilter) queryParams.append("priority", priorityFilter);
  const queryStr = queryParams.toString() ? `?${queryParams.toString()}` : "";
  const apiUrl = `/todos/${queryStr}`;

  const { data: todos, isLoading } = useSWR(status === "authenticated" ? apiUrl : null, fetcher);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const res = await signIn("credentials", { email, password, redirect: false });
    if (res?.error) setError("ERR: Invalid credentials.");
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("ERR: Passwords do not match.");
      return;
    }
    try {
      const apiUrl = process.env.NODE_ENV === 'production' ? 'https://taskboy-api.vercel.app/api' : 'http://localhost:8000/api';
      const res = await fetch(apiUrl + '/auth/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          first_name: firstName,
          last_name: lastName
        })
      });
      let data;
      try {
        data = await res.json();
      } catch (parseError) {
        throw new Error(`Server returned ${res.status} (non-JSON). Check backend logs.`);
      }
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      await signIn("credentials", { email, password, redirect: false });
    } catch (err: any) {
      setError("ERR: " + err.message);
    }
  };

  const createTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    const tempTodo = {
      id: Date.now(),
      title,
      description,
      priority,
      completed: false,
      pinned: false,
      created_at: new Date().toISOString()
    };

    mutate(apiUrl, (current: any) => [tempTodo, ...(current || [])], false);

    const submitTitle = title;
    const submitDesc = description;
    const submitPriority = priority;

    setTitle("");
    setDescription("");
    setPriority("MEDIUM");
    setShowAddModal(false);

    await fetchWithAuth('/todos/', {
      method: 'POST',
      body: JSON.stringify({ title: submitTitle, description: submitDesc, priority: submitPriority })
    });

    mutate(apiUrl);
  };

  const toggleComplete = async (id: number, currentCompleted: boolean) => {
    mutate(apiUrl, todos?.map((t: any) => t.id === id ? { ...t, completed: !currentCompleted } : t), false);

    await fetchWithAuth(`/todos/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify({ completed: !currentCompleted })
    });

    mutate(apiUrl);
  };

  const togglePin = async (id: number, currentPinned: boolean) => {
    mutate(apiUrl, todos?.map((t: any) => t.id === id ? { ...t, pinned: !currentPinned } : t), false);

    await fetchWithAuth(`/todos/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify({ pinned: !currentPinned })
    });

    mutate(apiUrl);
  };

  const deleteTodo = async (id: number) => {
    mutate(apiUrl, todos?.filter((t: any) => t.id !== id), false);

    await fetchWithAuth(`/todos/${id}/`, { method: 'DELETE' });

    mutate(apiUrl);
  };

  const now = new Date().getTime();
  const thresholdMs = oldDaysThreshold * 24 * 60 * 60 * 1000;

  const allTodos = todos || [];
  const activeTodos = allTodos.filter((t: any) => !t.completed || (now - new Date(t.created_at).getTime()) < thresholdMs);
  const oldTodos = allTodos.filter((t: any) => t.completed && (now - new Date(t.created_at).getTime()) >= thresholdMs);

  if (status === "loading") {
    return <div className="p-8 text-xl animate-pulse">Loading system..._</div>;
  }

  if (status === "unauthenticated" || !session) {
    return (
      <>
      <div className="fixed inset-0 bg-black">
        <DitheredPlanet />
      </div>
      <div className="relative flex flex-col justify-between min-h-screen p-4 sm:p-8 text-xl sm:text-2xl tracking-wide w-full overflow-hidden">

        {/* TOP LEFT (LOGO + TITLE) */}
        <div className="flex flex-row items-center justify-center sm:justify-start gap-4 sm:gap-6 mt-4 z-10 w-full">
          <img src="/logo.png" alt="Logo" className="w-12 sm:w-16 md:w-20 flex-shrink-0" style={{ imageRendering: 'pixelated' }} />
          <div className="overflow-hidden flex-shrink min-w-0">
            <pre className="text-purple-400 font-bold text-[4px] min-[400px]:text-[5px] sm:text-[7px] md:text-[9px] lg:text-xs leading-none m-0 text-left">
{`████████╗ █████╗ ███████╗██╗  ██╗██████╗  ██████╗ ██╗   ██╗
╚══██╔══╝██╔══██╗██╔════╝██║ ██╔╝██╔══██╗██╔═══██╗╚██╗ ██╔╝
   ██║   ███████║███████╗█████╔╝ ██████╔╝██║   ██║ ╚████╔╝
   ██║   ██╔══██║╚════██║██╔═██╗ ██╔══██╗██║   ██║  ╚██╔╝
   ██║   ██║  ██║███████║██║  ██╗██████╔╝╚██████╔╝   ██║
   ╚═╝   ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═════╝  ╚═════╝    ╚═╝   `}
            </pre>
          </div>
        </div>

        {/* BOTTOM ROW - description flush left, buttons flush right */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end w-full mb-4 sm:mb-8 z-10 gap-8 mt-auto">

          {/* BOTTOM LEFT DESCRIPTION */}
          <div className="flex flex-col text-base sm:text-lg md:text-2xl w-full lg:max-w-xl">
            <p className="mb-4 text-white">
              &gt; A minimal, blazingly fast task management system.
            </p>
            <ul className="list-disc pl-6 sm:pl-8 text-white/90">
              <li>Stateless JWT Authentication</li>
              <li>Priority filtering & full-text search</li>
              <li>Pure terminal aesthetic</li>
            </ul>
          </div>

          {/* BOTTOM RIGHT BUTTONS */}
          <div className="flex flex-col gap-4 sm:gap-6 text-xl sm:text-2xl md:text-3xl w-full lg:w-80 flex-shrink-0 mt-4 lg:mt-0">
            <button
              onClick={() => setAuthMode("login")}
              className="px-4 py-3 sm:py-4 border-2 border-purple-400 bg-black/40 backdrop-blur-md hover:bg-purple-400 hover:text-black transition-colors w-full text-center lg:text-right"
            >
              [ LOGIN ]
            </button>
            <button
              onClick={() => setAuthMode("register")}
              className="px-4 py-3 sm:py-4 border-2 border-purple-400 bg-black/40 backdrop-blur-md hover:bg-purple-400 hover:text-black transition-colors w-full text-center lg:text-right"
            >
              [ SIGN_UP ]
            </button>
          </div>
        </div>

        {/* BOTTOM MODAL OVERLAY */}
        <Modal
          isOpen={authMode !== "none"}
          onClose={() => { setAuthMode("none"); setError(""); }}
          title={authMode}
          maxWidth="max-w-4xl"
        >
          <form onSubmit={authMode === "login" ? handleLogin : handleRegister} className="flex flex-col gap-6 w-full mt-4">
            {error && <div className="text-red-500 bg-red-950/30 p-4 border border-red-500 text-sm sm:text-base">{error}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              {authMode === "register" && (
                <>
                  <div className="flex flex-col gap-2">
                    <label className="text-white text-sm sm:text-base">First_Name:</label>
                    <input
                      type="text"
                      required
                      autoFocus
                      className="bg-transparent border-b-2 border-purple-400 outline-none text-purple-400 p-2 text-xl sm:text-3xl focus:bg-purple-950/20 transition-colors w-full"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-white text-sm sm:text-base">Last_Name:</label>
                    <input
                      type="text"
                      required
                      className="bg-transparent border-b-2 border-purple-400 outline-none text-purple-400 p-2 text-xl sm:text-3xl focus:bg-purple-950/20 transition-colors w-full"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div className="flex flex-col gap-2">
                <label className="text-white text-sm sm:text-base">Email_Address:</label>
                <input
                  type="email"
                  required
                  autoFocus={authMode === "login"}
                  className="bg-transparent border-b-2 border-purple-400 outline-none text-purple-400 p-2 text-xl sm:text-3xl focus:bg-purple-950/20 transition-colors w-full"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-white text-sm sm:text-base">Password_String:</label>
                <input
                  type="password"
                  required
                  className="bg-transparent border-b-2 border-purple-400 outline-none text-purple-400 p-2 text-xl sm:text-3xl focus:bg-purple-950/20 transition-colors w-full"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {authMode === "register" && (
                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="text-white text-sm sm:text-base">Confirm_Password:</label>
                  <input
                    type="password"
                    required
                    className="bg-transparent border-b-2 border-purple-400 outline-none text-purple-400 p-2 text-xl sm:text-3xl focus:bg-purple-950/20 transition-colors w-full"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end mt-2 sm:mt-4">
              <button type="submit" className="w-full sm:w-auto px-8 sm:px-12 py-3 sm:py-4 bg-purple-400 text-black text-xl sm:text-3xl font-bold hover:bg-white transition-colors">
                EXECUTE_COMMAND
              </button>
            </div>
          </form>
        </Modal>
      </div>
      </>
    );
  }

  return (
    <div className="w-full max-w-[1800px] mx-auto p-4 md:p-8 lg:p-12 text-base sm:text-xl">
      <div className="flex flex-col md:flex-row justify-between items-center md:items-center mb-6 sm:mb-8 border-b-2 border-purple-400 pb-4 gap-4">
        <div className="flex flex-row items-center justify-center md:justify-start gap-4 sm:gap-6 w-full md:w-auto">
          <img src="/logo.png" alt="Logo" className="w-12 sm:w-16 md:w-20 flex-shrink-0" style={{ imageRendering: 'pixelated' }} />
          <div className="overflow-hidden flex-shrink min-w-0">
            <pre className="text-purple-400 font-bold text-[3px] min-[400px]:text-[4.5px] sm:text-[6px] md:text-[8px] lg:text-[10px] leading-none m-0 text-left">
{`██████╗  █████╗ ███████╗██╗  ██╗██████╗  ██████╗  █████╗ ██████╗ ██████╗
██╔══██╗██╔══██╗██╔════╝██║  ██║██╔══██╗██╔═══██╗██╔══██╗██╔══██╗██╔══██╗
██║  ██║███████║███████╗███████║██████╔╝██║   ██║███████║██████╔╝██║  ██║
██║  ██║██╔══██║╚════██║██╔══██║██╔══██╗██║   ██║██╔══██║██╔══██╗██║  ██║
██████╔╝██║  ██║███████║██║  ██║██████╔╝╚██████╔╝██║  ██║██║  ██║██████╔╝
╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝`}
            </pre>
          </div>
        </div>
        <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-4 w-full md:w-auto mt-4 md:mt-0">
          <span className="text-white text-sm sm:text-base truncate w-full md:w-auto max-w-[200px] md:max-w-none uppercase">USER: {session.user?.name || session.user?.email}</span>
          <div className="flex flex-row gap-2 sm:gap-4 w-full md:w-auto justify-start md:justify-center">
            <button onClick={() => setShowOldModal(true)} className="hover:text-purple-400 border border-current px-2 py-1 text-sm sm:text-base whitespace-nowrap">
              [OLD TASKS]
            </button>
            <button onClick={() => signOut()} className="hover:text-red-500 border border-current px-2 py-1 text-sm sm:text-base whitespace-nowrap">
              [LOGOUT]
            </button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 xl:grid-cols-5 gap-8">
        <div className="hidden lg:block lg:col-span-1 xl:col-span-1">
          <form onSubmit={createTodo} className="border-2 border-white/30 p-4 sm:p-6 flex flex-col gap-4 sticky top-8">
            <h2 className="text-2xl mb-2 text-white">++ ADD_TASK</h2>
            <input
              className="bg-transparent border border-white/30 focus:border-purple-400 p-3 outline-none w-full transition-colors text-white placeholder-white/40"
              placeholder="TITLE..."
              value={title}
              maxLength={100}
              onChange={e => setTitle(e.target.value)}
            />
            <textarea
              className="bg-transparent border border-white/30 focus:border-purple-400 p-3 outline-none h-32 w-full resize-none transition-colors text-white placeholder-white/40"
              placeholder="DESC..."
              value={description}
              maxLength={200}
              onChange={e => setDescription(e.target.value)}
            />
            <div className="flex border border-white/30 p-1 bg-black w-full">
              {[{value: "LOW", label: "LOW"}, {value: "MEDIUM", label: "MEDIUM"}, {value: "HIGH", label: "HIGH"}].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPriority(opt.value)}
                  className={`flex-1 px-2 py-3 text-base sm:text-lg text-center font-bold transition-colors whitespace-nowrap ${priority === opt.value ? 'bg-purple-400 text-black' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button type="submit" className="bg-purple-400 text-black py-3 mt-2 hover:bg-white font-bold transition-colors w-full">
              EXECUTE
            </button>
          </form>
        </div>

        <div className="lg:col-span-3 xl:col-span-4 flex flex-col gap-6">
          <button
            onClick={() => setShowAddModal(true)}
            className="lg:hidden w-full px-4 py-4 border-2 border-purple-400 bg-purple-950/40 backdrop-blur-md text-purple-400 hover:bg-purple-400 hover:text-black font-bold text-2xl transition-colors mb-2"
          >
            ++ ADD_TASK
          </button>

          <div className="flex flex-col md:flex-row gap-4 mb-2 items-end">
            <div className="flex-1 w-full flex flex-col">
              <label className="text-white/70 text-sm mb-1 uppercase">Search:</label>
              <input
                className="bg-transparent border border-white/30 focus:border-purple-400 p-3 outline-none transition-colors text-white placeholder-white/40"
                placeholder="SEARCH_QUERY..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="w-full md:w-auto flex flex-col flex-1">
              <label className="text-white/70 text-sm mb-1 uppercase">Filter:</label>
              <div className="flex border border-white/30 p-1 bg-black w-full overflow-x-auto">
                {[{value: "", label: "ALL"}, {value: "LOW", label: "LOW"}, {value: "MEDIUM", label: "MED"}, {value: "HIGH", label: "HIGH"}].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPriorityFilter(opt.value)}
                    className={`flex-1 px-3 py-2 text-base sm:text-lg text-center font-bold transition-colors whitespace-nowrap ${priorityFilter === opt.value ? 'bg-purple-400 text-black' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="w-full md:w-auto flex flex-col flex-1">
              <label className="text-white/70 text-sm mb-1 uppercase">Sort:</label>
              <div className="flex border border-white/30 p-1 bg-black w-full overflow-x-auto">
                {[{value: "PRIORITY", label: "PRIORITY"}, {value: "TIME_DESC", label: "NEW"}, {value: "TIME_ASC", label: "OLD"}].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSortOrder(opt.value)}
                    className={`flex-1 px-3 py-2 text-base sm:text-lg text-center font-bold transition-colors whitespace-nowrap ${sortOrder === opt.value ? 'bg-purple-400 text-black' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {isLoading && <div className="text-center p-8 animate-pulse">FETCHING_DATA..._</div>}

          {!isLoading && todos?.length === 0 && (
            <div className="text-center p-12 border-2 border-dashed border-purple-400 text-white/70">
              NO_TASKS_FOUND.
            </div>
          )}

          <div className="flex flex-col gap-3">
            {activeTodos.sort((a: any, b: any) => {
              if (a.completed !== b.completed) {
                return a.completed ? 1 : -1;
              }
              if (a.pinned !== b.pinned) {
                return a.pinned ? -1 : 1;
              }
              if (sortOrder === "PRIORITY") {
                const priorityOrder: any = { HIGH: 1, MEDIUM: 2, LOW: 3 };
                return (priorityOrder[a.priority] || 4) - (priorityOrder[b.priority] || 4);
              } else if (sortOrder === "TIME_DESC") {
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
              } else if (sortOrder === "TIME_ASC") {
                return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
              }
              return 0;
            }).map((todo: any) => {
              const pColor =
                todo.priority === 'HIGH' ? 'border-red-500 text-red-500' :
                todo.priority === 'MEDIUM' ? 'border-yellow-500 text-yellow-500' :
                'border-green-500 text-green-500';

              const pBg =
                todo.priority === 'HIGH' ? 'bg-red-950/20 hover:bg-red-900/40' :
                todo.priority === 'MEDIUM' ? 'bg-yellow-950/20 hover:bg-yellow-900/40' :
                'bg-green-950/20 hover:bg-green-900/40';

              const pBorder =
                todo.priority === 'HIGH' ? 'border-l-red-500 border-y-red-900/30 border-r-red-900/30' :
                todo.priority === 'MEDIUM' ? 'border-l-yellow-500 border-y-yellow-900/30 border-r-yellow-900/30' :
                'border-l-green-500 border-y-green-900/30 border-r-green-900/30';

              return (
              <div key={todo.id} className={`flex items-start gap-4 p-4 border border-l-4 ${pBorder} ${pBg} transition-colors ${todo.completed ? 'opacity-50 grayscale' : ''}`}>
                <button
                  onClick={() => toggleComplete(todo.id, todo.completed)}
                  className={`mt-1 flex-shrink-0 text-2xl sm:text-3xl font-bold transition-all duration-200 hover:-translate-y-1
                    ${todo.completed
                      ? 'text-purple-400 hover:text-purple-300 hover:drop-shadow-[0_0_8px_rgba(192,132,252,0.8)]'
                      : 'text-white/70 hover:text-purple-400 hover:drop-shadow-[0_0_8px_rgba(192,132,252,0.8)]'}`}
                >
                  [{todo.completed ? 'X' : '\u00A0'}]
                </button>
                <div className="flex-1 min-w-0">
                  <h3 className={`text-2xl truncate ${todo.completed ? 'line-through text-white/70' : ''}`}>
                    {todo.title}
                  </h3>
                  {todo.description && <p className="text-white text-lg mt-1">{todo.description}</p>}
                  <div className="flex gap-2 mt-2 text-sm flex-wrap">
                    <span className={`border px-2 py-1 font-bold ${pColor}`}>
                      PRIORITY: {todo.priority}
                    </span>
                    {todo.created_at && (
                      <span className="border border-white/30 px-2 py-1 text-white/70 font-mono">
                        {new Date(todo.created_at).toLocaleString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(',', '')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-3 items-end">
                  <button
                    onClick={() => togglePin(todo.id, todo.pinned)}
                    className={`font-bold transition-all duration-200 hover:-translate-y-1 ${todo.pinned ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]' : 'text-white/50 hover:text-yellow-400 hover:drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]'}`}
                  >
                    [PIN]
                  </button>
                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className="text-white/50 hover:text-red-500 font-bold transition-all duration-200 hover:-translate-y-1 hover:drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]"
                  >
                    [DEL]
                  </button>
                </div>
              </div>
              );
            })}
          </div>
        </div>
      </div>

      <Modal
        isOpen={showOldModal}
        onClose={() => setShowOldModal(false)}
        title="OLD TASKS"
        maxWidth="max-w-4xl"
      >
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-white/70 text-base sm:text-lg">Hide tasks older than</span>
          <input
            type="number"
            min="1"
            max="365"
            className="bg-black border border-white/30 text-purple-400 w-16 p-1 text-center outline-none"
            value={oldDaysThreshold}
            onChange={(e) => updateThreshold(Number(e.target.value) || 7)}
          />
          <span className="text-white/70 text-lg">days.</span>
        </div>

        <div className="flex flex-col gap-3">
          {oldTodos.length === 0 ? (
            <div className="text-center p-12 border-2 border-dashed border-purple-400 text-white/70">
              NO OLD TASKS FOUND.
            </div>
          ) : (
            [...oldTodos].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((todo: any) => {
              const pColor =
                todo.priority === 'HIGH' ? 'border-red-500 text-red-500' :
                todo.priority === 'MEDIUM' ? 'border-yellow-500 text-yellow-500' :
                'border-green-500 text-green-500';
              const pBg =
                todo.priority === 'HIGH' ? 'bg-red-950/20' :
                todo.priority === 'MEDIUM' ? 'bg-yellow-950/20' :
                'bg-green-950/20';
              const pBorder =
                todo.priority === 'HIGH' ? 'border-l-red-500 border-y-red-900/30 border-r-red-900/30' :
                todo.priority === 'MEDIUM' ? 'border-l-yellow-500 border-y-yellow-900/30 border-r-yellow-900/30' :
                'border-l-green-500 border-y-green-900/30 border-r-green-900/30';

              return (
                <div key={todo.id} className={`flex items-start gap-4 p-4 border border-l-4 ${pBorder} ${pBg} ${todo.completed ? 'opacity-50 grayscale' : ''}`}>
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-2xl truncate ${todo.completed ? 'line-through text-white/70' : ''}`}>
                      {todo.title}
                    </h3>
                    {todo.description && <p className="text-white text-lg mt-1">{todo.description}</p>}
                    <div className="flex gap-2 mt-2 text-sm flex-wrap">
                      <span className={`border px-2 py-1 font-bold ${pColor}`}>
                        PRIORITY: {todo.priority}
                      </span>
                      {todo.created_at && (
                        <span className="border border-white/30 px-2 py-1 text-white/70 font-mono">
                          {new Date(todo.created_at).toLocaleString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(',', '')}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className="text-white/50 hover:text-red-500 font-bold transition-all duration-200 hover:-translate-y-1"
                  >
                    [DEL]
                  </button>
                </div>
              );
            })
          )}
        </div>
      </Modal>

      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="ADD_TASK"
        maxWidth="max-w-md"
      >
        <form onSubmit={createTodo} className="flex flex-col gap-4">
          <input
            className="bg-transparent border border-white/30 focus:border-purple-400 p-3 outline-none w-full transition-colors text-white placeholder-white/40"
            placeholder="TITLE..."
            value={title}
            maxLength={100}
            onChange={e => setTitle(e.target.value)}
          />
          <textarea
            className="bg-transparent border border-white/30 focus:border-purple-400 p-3 outline-none h-32 w-full resize-none transition-colors text-white placeholder-white/40"
            placeholder="DESC..."
            value={description}
            maxLength={200}
            onChange={e => setDescription(e.target.value)}
          />
          <div className="flex border border-white/30 p-1 bg-black w-full">
            {[{value: "LOW", label: "LOW"}, {value: "MEDIUM", label: "MEDIUM"}, {value: "HIGH", label: "HIGH"}].map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPriority(opt.value)}
                className={`flex-1 px-2 py-3 text-base sm:text-lg text-center font-bold transition-colors whitespace-nowrap ${priority === opt.value ? 'bg-purple-400 text-black' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button type="submit" className="bg-purple-400 text-black py-4 mt-2 hover:bg-white font-bold transition-colors w-full text-xl">
            EXECUTE
          </button>
        </form>
      </Modal>
    </div>
  );
}
