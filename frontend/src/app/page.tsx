"use client";

import { useSession, signOut } from "next-auth/react";
import useSWR, { mutate } from "swr";
import { fetchWithAuth } from "@/lib/fetch";
import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import DitheredPlanet from "@/components/DitheredPlanet";

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
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api') + '/auth/register/', {
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
      created_at: new Date().toISOString()
    };
    mutate(apiUrl, [tempTodo, ...(todos || [])], false);

    const submitTitle = title;
    const submitDesc = description;
    const submitPriority = priority;

    setTitle("");
    setDescription("");
    setPriority("MEDIUM");

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
        <div className="flex flex-col sm:flex-row items-center sm:items-center gap-4 sm:gap-6 mt-4 z-10 w-full">
          <img src="/logo.png" alt="Logo" className="w-12 sm:w-16 md:w-20" style={{ imageRendering: 'pixelated' }} />
          <div className="overflow-hidden w-full flex justify-center sm:justify-start">
            <pre className="text-purple-400 font-bold text-[4px] min-[400px]:text-[5px] sm:text-[7px] md:text-[9px] lg:text-xs leading-none m-0 text-center sm:text-left">
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
        {authMode !== "none" && (
          <div
            className="fixed inset-0 z-50 flex flex-col justify-end bg-black/70"
            style={{ animation: 'fadeIn 0.2s ease-out forwards' }}
          >
            {/* CLICK OUTSIDE TO CLOSE */}
            <div className="flex-1 w-full" onClick={() => { setAuthMode("none"); setError(""); }}></div>

            {/* SLIDING FORM CONTAINER */}
            <div
              className="w-full bg-black border-t-2 border-purple-400 p-4 sm:p-8 shadow-[0_-10px_40px_rgba(192,132,252,0.15)] overflow-y-auto max-h-[90vh]"
              style={{ animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
            >
              <form onSubmit={authMode === "login" ? handleLogin : handleRegister} className="max-w-4xl mx-auto flex flex-col gap-6 w-full">
                <div className="flex justify-between items-center border-b border-purple-400/30 pb-4 mb-2 sm:mb-4">
                  <h2 className="text-3xl sm:text-5xl uppercase font-bold text-purple-400">-- {authMode} --</h2>
                  <button type="button" onClick={() => { setAuthMode("none"); setError(""); }} className="text-white/70 hover:text-red-400 text-xl sm:text-3xl">
                    [ X ] CLOSE
                  </button>
                </div>

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
            </div>
          </div>
        )}
      </div>
      </>
    );
  }

  return (
    <div className="w-full max-w-[1800px] mx-auto p-4 md:p-8 lg:p-12 text-base sm:text-xl">
      <div className="flex flex-col sm:flex-row justify-between items-center sm:items-center mb-6 sm:mb-8 border-b-2 border-purple-400 pb-4 gap-4">
        <div className="flex flex-col sm:flex-row items-center sm:items-center gap-4 sm:gap-6 w-full sm:w-auto">
          <img src="/logo.png" alt="Logo" className="w-12 sm:w-16 md:w-20" style={{ imageRendering: 'pixelated' }} />
          <div className="overflow-hidden w-full flex justify-center sm:justify-start">
            <pre className="text-purple-400 font-bold text-[3px] min-[400px]:text-[4.5px] sm:text-[6px] md:text-[8px] lg:text-[10px] leading-none m-0">
{`██████╗  █████╗ ███████╗██╗  ██╗██████╗  ██████╗  █████╗ ██████╗ ██████╗
██╔══██╗██╔══██╗██╔════╝██║  ██║██╔══██╗██╔═══██╗██╔══██╗██╔══██╗██╔══██╗
██║  ██║███████║███████╗███████║██████╔╝██║   ██║███████║██████╔╝██║  ██║
██║  ██║██╔══██║╚════██║██╔══██║██╔══██╗██║   ██║██╔══██║██╔══██╗██║  ██║
██████╔╝██║  ██║███████║██║  ██║██████╔╝╚██████╔╝██║  ██║██║  ██║██████╔╝
╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝`}
            </pre>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto mt-4 sm:mt-0">
          <span className="text-white text-sm sm:text-base truncate w-full sm:w-auto max-w-[200px] sm:max-w-none uppercase">USER: {session.user?.name || session.user?.email}</span>
          <button onClick={() => setShowOldModal(true)} className="hover:text-purple-400 border border-current px-2 py-1 text-sm sm:text-base whitespace-nowrap">
            [OLD TASKS]
          </button>
          <button onClick={() => signOut()} className="hover:text-red-500 border border-current px-2 py-1 text-sm sm:text-base whitespace-nowrap">
            [LOGOUT]
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 xl:grid-cols-5 gap-8">
        <div className="lg:col-span-1 xl:col-span-1">
          <form onSubmit={createTodo} className="border-2 border-white/30 p-4 sm:p-6 flex flex-col gap-4 sticky top-8">
            <h2 className="text-2xl mb-2 text-white">++ ADD_TASK</h2>
            <input
              className="bg-transparent border border-white/30 focus:border-purple-400 p-3 outline-none w-full transition-colors text-white placeholder-white/40"
              placeholder="TITLE..."
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
            <textarea
              className="bg-transparent border border-white/30 focus:border-purple-400 p-3 outline-none h-32 w-full resize-none transition-colors text-white placeholder-white/40"
              placeholder="DESC..."
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
            <select className="bg-black border border-white/30 focus:border-purple-400 p-3 outline-none text-white w-full transition-colors" value={priority} onChange={e => setPriority(e.target.value)}>
              <option value="LOW">Low Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="HIGH">High Priority</option>
            </select>
            <button type="submit" className="bg-purple-400 text-black py-3 mt-2 hover:bg-white font-bold transition-colors w-full">
              EXECUTE
            </button>
          </form>
        </div>

        <div className="lg:col-span-3 xl:col-span-4 flex flex-col gap-6">
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
            <div className="w-full md:w-48 flex flex-col">
              <label className="text-white/70 text-sm mb-1 uppercase">Filter:</label>
              <select className="bg-black border border-white/30 focus:border-purple-400 p-3 outline-none text-white transition-colors" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
                <option value="">All Priorities</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
            <div className="w-full md:w-48 flex flex-col">
              <label className="text-white/70 text-sm mb-1 uppercase">Sort:</label>
              <select className="bg-black border border-white/30 focus:border-purple-400 p-3 outline-none text-white transition-colors" value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
                <option value="PRIORITY">Priority</option>
                <option value="TIME_DESC">Newest</option>
                <option value="TIME_ASC">Oldest</option>
              </select>
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

      {showOldModal && (
        <div
          className="fixed inset-0 z-50 flex justify-center items-center bg-black/80 backdrop-blur-sm p-4"
          style={{ animation: 'fadeIn 0.2s ease-out forwards' }}
        >
          <div className="w-full max-w-4xl bg-black border-2 border-purple-400 p-4 sm:p-8 shadow-[0_0_40px_rgba(192,132,252,0.15)] flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-start border-b border-purple-400/30 pb-4 mb-4">
              <div>
                <h2 className="text-3xl sm:text-4xl uppercase font-bold text-purple-400">-- OLD TASKS --</h2>
                <div className="mt-4 flex flex-wrap items-center gap-2">
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
              </div>
              <button type="button" onClick={() => setShowOldModal(false)} className="text-white/70 hover:text-red-400 text-xl sm:text-2xl font-bold">
                [ X ]
              </button>
            </div>

            <div className="overflow-y-auto flex-1 pr-2 custom-scrollbar flex flex-col gap-3">
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
          </div>
        </div>
      )}
    </div>
  );
}
