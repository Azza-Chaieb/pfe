import React, { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactPlayer from 'react-player';
import { getMyEnrollments, updateCourseProgress } from "../../services/courseService";
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Use reliable CDN for the pdfjs worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// Mock data for initial interface building
const MOCK_COURSE = {
  id: "course_1",
  title: "Introduction à React.js",
  modules: [
    {
      id: "mod_1",
      title: "Module 1: Les bases de React",
      lessons: [
        { id: "les_1_1", title: "Qu'est ce que React ?", duration: "5:30", type: "video", url: "https://www.youtube.com/watch?v=Tn6-PIqc4UM", completed: true },
        { id: "les_1_2", title: "Installation et configuration", duration: "10:15", type: "video", url: "https://www.youtube.com/watch?v=w7ejDZ8SWv8", completed: true },
        { id: "les_1_3", title: "JSX et composants", duration: "15:00", type: "document", url: "/dummy.pdf", completed: false },
      ],
    },
    {
      id: "mod_2",
      title: "Module 2: État et cycle de vie",
      lessons: [
        { id: "les_2_1", title: "Le hook useState", duration: "12:45", type: "video", url: "https://www.youtube.com/watch?v=O6P86uwfdR0", completed: false },
        { id: "les_2_2", title: "Le hook useEffect", duration: "18:20", type: "video", url: "https://www.youtube.com/watch?v=0ZJgIjIuY7U", completed: false },
        { id: "les_2_3", title: "Exercice pratique", duration: "30:00", type: "document", url: "/dummy.pdf", completed: false },
      ],
    },
  ],
};

const CoursePlayer = () => {
  const { courseId } = useParams(); // Using courseId instead of id based on App.jsx route
  const navigate = useNavigate();

  // State
  const [course, setCourse] = useState(MOCK_COURSE);
  const [activeLessonId, setActiveLessonId] = useState(course.modules[0].lessons[0].id);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [enrollment, setEnrollment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Video Player state
  const [playedProgress, setPlayedProgress] = useState(0);
  const playerRef = useRef(null);

  // Document Viewer state
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);

  // Derived state to find active module and lesson
  let activeModuleIndex = -1;
  let activeLessonIndex = -1;
  let activeModule = null;
  let activeLesson = null;

  course.modules.forEach((mod, mIndex) => {
    mod.lessons.forEach((les, lIndex) => {
      if (les.id === activeLessonId) {
        activeModuleIndex = mIndex;
        activeLessonIndex = lIndex;
        activeModule = mod;
        activeLesson = les;
      }
    });
  });

  // Flat list of all lessons for easier next/prev navigation
  const allLessonsFlat = course.modules.flatMap(m => m.lessons);
  const currentFlatIndex = allLessonsFlat.findIndex(l => l.id === activeLessonId);
  const hasPrev = currentFlatIndex > 0;
  const hasNext = currentFlatIndex < allLessonsFlat.length - 1;

  // Calculate overall progress
  const totalLessons = allLessonsFlat.length;
  const completedLessons = allLessonsFlat.filter(l => l.completed).length;
  const progressPercentage = Math.round((completedLessons / Math.max(totalLessons, 1)) * 100);

  // API Syncing
  useEffect(() => {
    const fetchEnrollment = async () => {
      try {
        setIsLoading(true);
        const res = await getMyEnrollments();
        const enrollments = res?.data || [];
        // Assuming courseId is the documentId
        const currentEnrollment = enrollments.find(e => {
          const cId = e.course?.documentId || e.attributes?.course?.data?.attributes?.documentId;
          return cId === courseId || courseId === 'r5srley41vc1y86ne64wedqw'; // fallback to mock route matching
        }) || enrollments[0]; // fallback to first for testing

        if (currentEnrollment) {
          setEnrollment(currentEnrollment);
          const rawLessonProgress = currentEnrollment.lesson_progress || currentEnrollment.attributes?.lesson_progress || {};
          
          // Sync course state with API lesson progress
          setCourse(prevCourse => {
            const updated = { ...prevCourse };
            updated.modules = updated.modules.map(m => ({
              ...m,
              lessons: m.lessons.map(l => ({
                ...l,
                completed: rawLessonProgress[l.id]?.completed || false,
                watchTime: rawLessonProgress[l.id]?.watchTime || 0
              }))
            }));
            return updated;
          });
        }
      } catch (error) {
        console.error("Failed to load enrollment progress", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEnrollment();
  }, [courseId]);

  const saveProgressToApi = useCallback((newCourseState) => {
    if (!courseId) return;
    
    // Build the lesson_progress json payload from current lessons state
    const allFlat = newCourseState.modules.flatMap(m => m.lessons);
    const lessonProgressPayload = {};
    allFlat.forEach(l => {
      lessonProgressPayload[l.id] = {
        completed: l.completed || false,
        watchTime: l.watchTime || 0
      };
    });

    const completedCount = allFlat.filter(l => l.completed).length;
    const progressPct = Math.round((completedCount / Math.max(allFlat.length, 1)) * 100);

    updateCourseProgress(courseId, progressPct, lessonProgressPayload)
      .catch(err => console.error("Failed to save progress", err));
  }, [courseId]);

  // Handlers
  const handleNavNext = () => {
    if (hasNext) {
      setActiveLessonId(allLessonsFlat[currentFlatIndex + 1].id);
      setPlayedProgress(0); // Reset video progress for new video
      setPageNumber(1); // Reset document page
      setScale(1.0); // Reset zoom
    }
  };

  const handleNavPrev = () => {
    if (hasPrev) {
      setActiveLessonId(allLessonsFlat[currentFlatIndex - 1].id);
      setPlayedProgress(0);
      setPageNumber(1);
      setScale(1.0);
    }
  };

  const handleVideoProgress = (state) => {
    setPlayedProgress(Math.round(state.played * 100)); // state.played is a fraction between 0 and 1
    
    // Save watch time to state quietly (debounced in a real app, here we just do it on end or milestones)
    if (activeLesson) {
       activeLesson.watchTime = state.playedSeconds;
    }

    // Automatically mark as completed if played over 90%
    if (state.played > 0.9 && activeLesson && !activeLesson.completed) {
      toggleLessonStatus();
    }
  };

  const toggleLessonStatus = () => {
    if (activeLesson) {
      setCourse(prev => {
        const updated = { ...prev };
        let modifiedHasChanged = false;

        updated.modules = updated.modules.map(m => {
          return {
            ...m,
            lessons: m.lessons.map(l => {
              if (l.id === activeLessonId) {
                modifiedHasChanged = true;
                return { ...l, completed: !l.completed };
              }
              return l;
            })
          };
        });

        if (modifiedHasChanged) {
           saveProgressToApi(updated);
        }
        return updated;
      });
    }
  };

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.2, 3.0));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));
  
  const handleNextPage = () => setPageNumber(prev => Math.min(prev + 1, numPages || 1));
  const handlePrevPage = () => setPageNumber(prev => Math.max(prev - 1, 1));

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans overflow-hidden">
      
      {/* Top Navbar */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-20">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate("/dashboard")}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          </button>
          <div className="hidden md:block h-6 w-px bg-slate-200"></div>
          
          {/* Breadcrumb */}
          <nav className="hidden md:flex items-center text-sm font-medium text-slate-500">
            <span className="hover:text-blue-600 cursor-pointer transition-colors" onClick={() => navigate("/dashboard")}>Mes Cours</span>
            <span className="mx-2">/</span>
            <span className="hover:text-blue-600 cursor-pointer transition-colors truncate max-w-[200px]" title={course.title}>{course.title}</span>
            <span className="mx-2">/</span>
            <span className="text-slate-900 font-bold truncate max-w-[250px]" title={activeLesson?.title}>{activeLesson?.title}</span>
          </nav>
        </div>

        <div className="flex items-center gap-6">
          {/* Progress Bar Header */}
          <div className="hidden sm:flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{progressPercentage}% complété</span>
            <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden w-10 h-10 rounded-lg flex items-center justify-center bg-slate-100 text-slate-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
          </button>
        </div>
      </header>

      {/* Main Layout Area */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Main Content (Player) */}
        <main className="flex-1 shrink flex flex-col relative bg-slate-100 overflow-y-auto w-full">
          
          {/* Video / Content Area Container */}
          <div className="flex-1 flex flex-col w-full max-w-5xl mx-auto p-4 md:p-8">
            
            {activeLesson?.type === 'video' ? (
              <div className="w-full aspect-video bg-black rounded-2xl shadow-xl flex items-center justify-center overflow-hidden relative group">
                <ReactPlayer 
                  ref={playerRef}
                  url={activeLesson?.url || 'https://www.youtube.com/watch?v=ysz5S6PUM-U'} 
                  width="100%" 
                  height="100%" 
                  controls={true} // Enables play/pause, seek, volume, full screen, speed
                  onProgress={handleVideoProgress}
                  playing={false}
                  config={{
                    youtube: {
                      playerVars: { showinfo: 1 }
                    }
                  }}
                  style={{ position: 'absolute', top: 0, left: 0 }}
                />
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden border border-slate-200" style={{ height: 'calc(100vh - 300px)', minHeight: '600px' }}>
                {/* Document Toolbar */}
                <div className="h-14 bg-slate-50 border-b border-slate-200 flex items-center justify-between px-4 shrink-0">
                  <div className="flex items-center gap-2">
                    <button onClick={handleZoomOut} className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-200 text-slate-600" title="Zoom Arrière">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7"></path></svg>
                    </button>
                    <span className="text-xs font-bold w-12 text-center text-slate-500">{Math.round(scale * 100)}%</span>
                    <button onClick={handleZoomIn} className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-200 text-slate-600" title="Zoom Avant">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"></path></svg>
                    </button>
                  </div>
                  
                  {numPages && (
                    <div className="flex items-center gap-3">
                      <button onClick={handlePrevPage} disabled={pageNumber <= 1} className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-200 disabled:opacity-30">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                      </button>
                      <span className="text-sm font-medium text-slate-600">Page {pageNumber} sur {numPages}</span>
                      <button onClick={handleNextPage} disabled={pageNumber >= numPages} className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-200 disabled:opacity-30">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <a href={activeLesson?.url} download target="_blank" rel="noreferrer" className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-200 text-slate-600" title="Télécharger">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                    </a>
                  </div>
                </div>

                {/* PDF Document Container */}
                <div className="flex-1 overflow-auto bg-slate-200 p-8 flex justify-center custom-scrollbar">
                  {activeLesson?.url ? (
                    <Document
                      file={activeLesson.url}
                      onLoadSuccess={onDocumentLoadSuccess}
                      className="flex flex-col items-center"
                      loading={
                        <div className="flex flex-col items-center justify-center h-64">
                          <div className="w-10 h-10 border-4 border-slate-300 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                          <p className="text-slate-500 font-medium">Chargement du document...</p>
                        </div>
                      }
                      error={
                        <div className="text-center text-red-500 p-8 bg-white rounded-lg">
                          <span className="text-4xl mb-2 block">⚠️</span>
                          <p>Erreur lors du chargement du fichier PDF.</p>
                        </div>
                      }
                    >
                      <Page 
                        pageNumber={pageNumber} 
                        scale={scale} 
                        renderTextLayer={true}
                        renderAnnotationLayer={true}
                        className="shadow-xl mb-4 bg-white"
                      />
                    </Document>
                  ) : (
                    <div className="text-center text-slate-400 m-auto">
                      <span className="text-6xl mb-4 block">📄</span>
                      <p className="font-medium">Aucun document attaché.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Lesson Info Footer */}
            <div className="mt-8 bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h1 className="text-2xl font-black text-slate-800 mb-2">{activeLesson?.title}</h1>
                  <p className="text-slate-500 text-sm font-medium">
                    {activeModule?.title} 
                    {activeLesson?.type === 'video' && playedProgress > 0 && playedProgress < 100 && (
                      <span className="ml-3 text-blue-600 font-bold">• Vidéo vue à {playedProgress}%</span>
                    )}
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <button 
                    onClick={toggleLessonStatus}
                    className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeLesson?.completed ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    {activeLesson?.completed ? (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                        Terminé
                      </>
                    ) : (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-slate-400"></div>
                        Marquer comme terminé
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Navigation Buttons Footer */}
            <div className="mt-6 flex items-center justify-between">
              <button 
                onClick={handleNavPrev}
                disabled={!hasPrev}
                className="px-6 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-all disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-slate-700 flex items-center gap-2 shadow-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                Précédent
              </button>
              
              <button 
                onClick={handleNavNext}
                disabled={!hasNext}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50 shadow-lg shadow-blue-500/30 flex items-center gap-2"
              >
                Suivant
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
              </button>
            </div>
          </div>
        </main>

        {/* Sidebar Navigation */}
        <aside className={`w-[320px] shrink-0 bg-white border-l border-slate-200 flex flex-col transition-all duration-300 ${sidebarOpen ? 'translate-x-0' : 'translate-x-full fixed right-0 h-full shadow-2xl z-30 md:static md:translate-x-full md:w-0 md:border-none'}`}>
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-black text-slate-800 tracking-tight">Contenu du cours</h2>
            <button onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-slate-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {course.modules.map((module, mIdx) => {
              const moduleLessonsCount = module.lessons.length;
              const moduleCompletedCount = module.lessons.filter(l => l.completed).length;
              
              return (
                <div key={module.id} className="border-b border-slate-100">
                  <div className="bg-slate-50 p-4 shrink-0 pointer-events-none flex justify-between items-center group">
                    <h3 className="font-bold text-sm text-slate-700 group-hover:text-blue-600 transition-colors line-clamp-2">{mIdx + 1}. {module.title}</h3>
                    <span className="text-[10px] font-bold text-slate-400 tabular-nums">{moduleCompletedCount}/{moduleLessonsCount}</span>
                  </div>
                  <ul className="py-2">
                    {module.lessons.map((lesson, lIdx) => {
                      const isActive = activeLessonId === lesson.id;
                      return (
                        <li key={lesson.id}>
                          <button 
                            onClick={() => setActiveLessonId(lesson.id)}
                            className={`w-full text-left p-3 pl-5 flex gap-3 items-start transition-colors relative group
                              ${isActive ? 'bg-blue-50/50' : 'hover:bg-slate-50'}
                            `}
                          >
                            {/* Active Indicator Line */}
                            {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-r-full"></div>}
                            
                            {/* Status Icon */}
                            <div className={`mt-0.5 shrink-0 ${lesson.completed ? 'text-green-500' : isActive ? 'text-blue-500' : 'text-slate-300 group-hover:text-slate-400'}`}>
                              {lesson.completed ? (
                                <svg className="w-5 h-5 outline outline-2 outline-white rounded-full" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                              ) : (
                                <div className={`w-5 h-5 rounded-full border-2 ${isActive ? 'border-blue-500 bg-white' : 'border-current'}`}></div>
                              )}
                            </div>

                            {/* Lesson Info */}
                            <div className="flex-1 min-w-0">
                               <p className={`text-sm font-medium line-clamp-2 leading-snug ${isActive ? 'text-blue-900 font-bold' : 'text-slate-700'}`}>{lesson.title}</p>
                               <div className="flex items-center gap-2 mt-1">
                                  {lesson.type === 'video' ? (
                                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                  ) : (
                                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                                  )}
                                  <span className="text-xs text-slate-500">{lesson.duration}</span>
                               </div>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Backdrop for mobile sidebar */}
        {!sidebarOpen && (
           <div className="hidden" />
        )}
        {sidebarOpen && (
          <div 
            onClick={() => setSidebarOpen(false)}
            className="md:hidden fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-20"
          ></div>
        )}

      </div>
    </div>
  );
};

export default CoursePlayer;
