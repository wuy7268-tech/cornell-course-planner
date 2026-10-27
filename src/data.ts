import type {
  College,
  Course,
  Interest,
  MathSlot,
  Req,
  Track,
  TrackId,
} from "./types";

const req = (id: string): Req => ({ op: "course", id });
const all = (...of: Req[]): Req => ({ op: "all", of });
const any = (...of: Req[]): Req => ({ op: "any", of });

const intro = req("CS 1110");
const oop = req("CS 2110");
const discrete = req("CS 2800");
const calc1 = any(req("MATH 1110"), req("MATH 1910"));
const calc2 = any(req("MATH 1120"), req("MATH 1920"));
const linalg = any(req("MATH 2210"), req("MATH 2940"), req("MATH 2310"));
const org = any(req("CS 3410"), req("CS 3420"));

function defineCourse(
  input: Omit<
    Course,
    | "concurrent"
    | "coreqs"
    | "waivers"
    | "alsoSatisfies"
    | "recommended"
    | "practicum"
    | "grad"
  > &
    Partial<
      Pick<
        Course,
        | "concurrent"
        | "coreqs"
        | "waivers"
        | "alsoSatisfies"
        | "recommended"
        | "practicum"
        | "grad"
      >
    >,
): Course {
  return {
    concurrent: [],
    coreqs: [],
    waivers: [],
    alsoSatisfies: [],
    recommended: [],
    practicum: false,
    grad: false,
    ...input,
  };
}

const allTracks = {
  software: "core",
  ai: "core",
  systems: "core",
  data: "core",
} as const;

export const interests: Interest[] = [
  { id: "software-design", label: "Software design" },
  { id: "testing", label: "Testing" },
  { id: "databases", label: "Databases" },
  { id: "compilers", label: "Compilers" },
  { id: "graphics", label: "Graphics" },
  { id: "game", label: "Games" },
  { id: "machine-learning", label: "Machine learning" },
  { id: "deep-learning", label: "Deep learning" },
  { id: "reasoning", label: "Reasoning" },
  { id: "nlp", label: "Language" },
  { id: "vision", label: "Vision" },
  { id: "robotics", label: "Robotics" },
  { id: "reinforcement", label: "Reinforcement learning" },
  { id: "systems", label: "Operating systems" },
  { id: "architecture", label: "Architecture" },
  { id: "networks", label: "Networks" },
  { id: "distributed", label: "Distributed systems" },
  { id: "security", label: "Security" },
  { id: "data-viz", label: "Data visualization" },
  { id: "probability", label: "Probability" },
];

export const interestLabel = new Map(interests.map((item) => [item.id, item.label]));

export const courses: Course[] = [
  defineCourse({
    id: "CS 1110",
    title: "Introduction to Computing: A Design and Development Perspective",
    credits: 4,
    dept: "CS",
    level: 1110,
    summary:
      "First programming course in Python, aimed at designing, testing, and structuring small programs.",
    terms: ["fall", "spring"],
    prereqs: null,
    workload: 3,
    interests: ["software-design"],
    skills: ["Python", "Testing", "Program design"],
    tracks: allTracks,
    note: "CS 1112 is the engineering-and-science alternative and cannot be taken for a second intro credit.",
  }),
  defineCourse({
    id: "CS 1112",
    title: "Introduction to Computing: An Engineering and Science Perspective",
    credits: 4,
    dept: "CS",
    level: 1112,
    summary:
      "Python for computation, simulation, and data handling, with NumPy-style scientific work.",
    terms: ["fall", "spring"],
    prereqs: calc1,
    workload: 3,
    interests: ["software-design"],
    skills: ["Python", "Numerical computing", "Plotting"],
    tracks: allTracks,
    alsoSatisfies: ["CS 1110"],
    note: "Fulfills the same requirement as CS 1110. CS 4750 lists 1112 specifically.",
  }),
  defineCourse({
    id: "CS 2043",
    title: "UNIX Tools and Scripting",
    credits: 1.5,
    dept: "CS",
    level: 2043,
    summary: "Shell, pipes, regular expressions, and scripting on Unix-like systems.",
    terms: ["spring"],
    prereqs: intro,
    workload: 2,
    interests: ["software-design", "systems"],
    skills: ["Unix", "Shell scripting", "Text processing"],
    tracks: { software: "track", systems: "track" },
  }),
  defineCourse({
    id: "CS 2110",
    title: "Object-Oriented Programming and Data Structures",
    credits: 4,
    dept: "CS",
    level: 2110,
    summary:
      "Java, specifications, and the standard data structures. The usual gateway into upper-level CS.",
    terms: ["fall", "spring"],
    prereqs: intro,
    workload: 4,
    interests: ["software-design"],
    skills: ["Java", "Data structures", "Complexity"],
    tracks: allTracks,
  }),
  defineCourse({
    id: "CS 2112",
    title: "Object-Oriented Design and Data Structures — Honors",
    credits: 5,
    dept: "CS",
    level: 2112,
    summary:
      "Honors treatment of CS 2110 with harder design work, patterns, and concurrency.",
    terms: ["fall"],
    prereqs: intro,
    workload: 5,
    interests: ["software-design"],
    skills: ["Java", "Design patterns", "Concurrency"],
    tracks: { software: "track", ai: "core", systems: "core", data: "core" },
    alsoSatisfies: ["CS 2110"],
    note: "Honors alternative to CS 2110. Fall only, and it expects a strong intro grade or instructor permission.",
  }),
  defineCourse({
    id: "CS 2800",
    title: "Mathematical Foundations of Computing",
    credits: 4,
    dept: "CS",
    level: 2800,
    summary:
      "Proofs, discrete math, graphs, automata, and the probability used across CS.",
    terms: ["fall", "spring"],
    prereqs: all(calc1, intro),
    workload: 4,
    interests: ["reasoning", "probability"],
    skills: ["Proofs", "Discrete math", "Probability"],
    tracks: allTracks,
  }),
  defineCourse({
    id: "CS 2802",
    title: "Mathematical Foundations of Computing — Honors",
    credits: 3,
    dept: "CS",
    level: 2802,
    summary: "Honors version of the discrete-math core, covering the same map in more depth.",
    terms: ["spring"],
    prereqs: all(calc1, intro),
    workload: 4,
    interests: ["reasoning"],
    skills: ["Proofs", "Discrete math", "Probability"],
    tracks: allTracks,
    alsoSatisfies: ["CS 2800"],
    note: "Recent offerings have been irregular. Confirm the roster before relying on it.",
  }),
  defineCourse({
    id: "CS 3110",
    title: "Functional Programming and Data Structures",
    credits: 4,
    dept: "CS",
    level: 3110,
    summary:
      "Programming with immutable data, types, and specifications. The design course behind algorithms, testing, and compilers.",
    terms: ["fall", "spring"],
    prereqs: all(oop, discrete),
    concurrent: ["CS 2800"],
    workload: 5,
    interests: ["software-design"],
    skills: ["Functional programming", "Types", "Specifications"],
    tracks: allTracks,
    note: "CS 2800 may be taken earlier or in the same semester. Avoid pairing this with CS 3410.",
  }),
  defineCourse({
    id: "CS 3152",
    title: "Introduction to Computer Game Architecture",
    credits: 4,
    dept: "CS",
    level: 3152,
    summary:
      "Team game project covering architecture, AI, graphics, and play. Counts as a practicum.",
    terms: ["spring"],
    prereqs: oop,
    workload: 5,
    interests: ["game", "software-design"],
    skills: ["Team projects", "Game architecture", "Software design"],
    tracks: { software: "track" },
    practicum: true,
    note: "Application required. ENGRC 3152 is a corequisite this planner does not schedule.",
  }),
  defineCourse({
    id: "CS 3300",
    title: "Visual Data Analytics for the Web",
    credits: 3,
    dept: "CS",
    level: 3300,
    summary:
      "Interactive visualization in the browser, mixing web programming with visual design.",
    terms: ["fall"],
    prereqs: oop,
    workload: 3,
    interests: ["data-viz"],
    skills: ["Visualization", "JavaScript", "Web graphics"],
    tracks: { data: "track", software: "track" },
    note: "Cross-listed with INFO 3300. The catalog also lists INFO 2310; confirm that on the roster.",
  }),
  defineCourse({
    id: "CS 3410",
    title: "Computer System Organization and Programming",
    credits: 4,
    dept: "CS",
    level: 3410,
    summary:
      "C, assembly, processors, and memory. The gate for operating systems, architecture, and compilers.",
    terms: ["fall", "spring"],
    prereqs: oop,
    workload: 5,
    interests: ["systems", "architecture"],
    skills: ["C", "Assembly", "Memory hierarchy"],
    tracks: allTracks,
    note: "Heavy. The default pathways keep it out of the same semester as CS 3110.",
  }),
  defineCourse({
    id: "CS 3420",
    title: "Embedded Systems",
    credits: 4,
    dept: "CS",
    level: 3420,
    summary:
      "Hardware-software interaction, interrupts, and real-time constraints. An alternate way to fill computer organization.",
    terms: ["fall", "spring"],
    prereqs: null,
    waivers: ["ece2300"],
    workload: 5,
    interests: ["systems"],
    skills: ["Embedded systems", "Interrupts", "Concurrency"],
    tracks: { systems: "track", software: "core", ai: "core", data: "core" },
    note: "Prerequisite is ECE 2300 or ENGRD 2300, not CS 2110. Mark that course done in your profile to unlock it.",
  }),
  defineCourse({
    id: "CS 3700",
    title: "Foundations of AI Reasoning and Decision-Making",
    credits: 3,
    dept: "CS",
    level: 3700,
    summary:
      "Search, games, knowledge representation, planning, and sequential decisions. Fills the AI core.",
    terms: ["fall", "spring"],
    prereqs: all(oop, discrete),
    workload: 4,
    interests: ["reasoning"],
    skills: ["Search", "Planning", "Probabilistic reasoning"],
    tracks: { ai: "track", software: "core", systems: "core", data: "core" },
  }),
  defineCourse({
    id: "CS 3780",
    title: "Introduction to Machine Learning",
    credits: 4,
    dept: "CS",
    level: 3780,
    summary:
      "Supervised learning from linear models through deep networks, with the theory underneath. Fills the AI core.",
    terms: ["fall", "spring"],
    prereqs: all(
      any(discrete, req("STSCI 3080"), req("MATH 4710"), req("ECON 3130"), req("ENGRD 2700")),
      linalg,
      calc1,
      oop,
    ),
    workload: 4,
    interests: ["machine-learning"],
    skills: ["Supervised learning", "Linear models", "Generalization"],
    tracks: { ai: "track", data: "track", software: "core", systems: "core" },
    note: "CS 2800 satisfies the probability option used here. Linear algebra has to come first.",
  }),
  defineCourse({
    id: "CS 4120",
    title: "Introduction to Compilers",
    credits: 3,
    dept: "CS",
    level: 4120,
    summary: "Build a compiler: parsing, type checking, and code generation for an object-oriented language.",
    terms: ["spring"],
    prereqs: all(req("CS 3110"), org),
    workload: 5,
    interests: ["compilers", "software-design"],
    skills: ["Parsing", "Type checking", "Code generation"],
    tracks: { software: "track", systems: "track" },
    note: "Not offered every spring. Take CS 4121 in the same semester.",
  }),
  defineCourse({
    id: "CS 4121",
    title: "Practicum in Compilers",
    credits: 2,
    dept: "CS",
    level: 4121,
    summary: "The implementation practicum that runs with the compilers course.",
    terms: ["spring"],
    prereqs: null,
    coreqs: ["CS 4120"],
    workload: 3,
    interests: ["compilers"],
    skills: ["Compiler implementation", "Testing"],
    tracks: { software: "track", systems: "track" },
    practicum: true,
  }),
  defineCourse({
    id: "CS 4320",
    title: "Introduction to Database Systems",
    credits: 3,
    dept: "CS",
    level: 4320,
    summary:
      "Data models, query processing, storage, transactions, and recovery.",
    terms: ["fall"],
    prereqs: all(oop, discrete),
    workload: 4,
    interests: ["databases"],
    skills: ["SQL", "Query processing", "Transactions"],
    tracks: { software: "track", data: "track", systems: "track" },
  }),
  defineCourse({
    id: "CS 4321",
    title: "Practicum in Database Systems",
    credits: 2,
    dept: "CS",
    level: 4321,
    summary: "Build part of a database system. Take it with CS 4320 or after it.",
    terms: ["fall"],
    prereqs: req("CS 4320"),
    concurrent: ["CS 4320"],
    workload: 3,
    interests: ["databases"],
    skills: ["Storage engines", "Java"],
    tracks: { software: "track", data: "track" },
    practicum: true,
  }),
  defineCourse({
    id: "CS 4410",
    title: "Operating Systems",
    credits: 3,
    dept: "CS",
    level: 4410,
    summary:
      "Concurrency, memory, files, and protection. Fills the systems core.",
    terms: ["spring"],
    prereqs: org,
    workload: 4,
    interests: ["systems"],
    skills: ["Concurrency", "Virtual memory", "File systems"],
    tracks: allTracks,
    note: "Also offered in summer. Some semesters are 4 credits; this planner uses the catalog's 3.",
  }),
  defineCourse({
    id: "CS 4411",
    title: "Practicum in Operating Systems",
    credits: 2,
    dept: "CS",
    level: 4411,
    summary: "Implement pieces of a kernel alongside CS 4410. This is the heavy part.",
    terms: ["fall", "spring"],
    prereqs: null,
    coreqs: ["CS 4410"],
    workload: 5,
    interests: ["systems"],
    skills: ["Kernel implementation", "Concurrency"],
    tracks: { systems: "track", software: "track" },
    practicum: true,
    note: "Plan it in the same semester as CS 4410, and not beside compilers.",
  }),
  defineCourse({
    id: "CS 4414",
    title: "Systems Programming",
    credits: 4,
    dept: "CS",
    level: 4414,
    summary:
      "Systems programming in C++, then how large ML applications actually run on machines and accelerators. Fills the systems core.",
    terms: ["fall"],
    prereqs: all(oop, req("CS 3410")),
    workload: 5,
    interests: ["systems", "machine-learning"],
    skills: ["C++", "Parallelism", "ML systems"],
    tracks: { data: "track", ai: "track", systems: "core", software: "core" },
    note: "Alternative to CS 4410, not an extra core. Usually fall.",
  }),
  defineCourse({
    id: "CS 4420",
    title: "Computer Architecture",
    credits: 4,
    dept: "CS",
    level: 4420,
    summary:
      "Pipelines, caches, and multicore design, with a semester-long hardware project.",
    terms: ["fall"],
    prereqs: any(req("CS 3410"), req("CS 3420"), req("ECE 3140")),
    workload: 5,
    interests: ["architecture"],
    skills: ["Pipelining", "Caches", "RTL design"],
    tracks: { systems: "track", software: "track" },
  }),
  defineCourse({
    id: "CS 4450",
    title: "Introduction to Computer Networks",
    credits: 3,
    dept: "CS",
    level: 4450,
    summary: "Protocols, routing, congestion control, and data-center networks.",
    terms: ["spring"],
    prereqs: null,
    recommended: ["CS 3410"],
    workload: 3,
    interests: ["networks"],
    skills: ["Protocols", "Routing", "Congestion control"],
    tracks: { systems: "track", software: "track" },
    note: "The catalog listing does not publish a formal prerequisite. CS 3410 is the useful preparation.",
  }),
  defineCourse({
    id: "CS 4620",
    title: "Introduction to Computer Graphics",
    credits: 3,
    dept: "CS",
    level: 4620,
    summary: "Images, geometry, ray tracing, and the graphics pipeline.",
    terms: ["fall"],
    prereqs: all(oop, calc2, linalg),
    workload: 4,
    interests: ["graphics"],
    skills: ["Ray tracing", "Linear algebra", "Graphics pipeline"],
    tracks: { software: "track" },
  }),
  defineCourse({
    id: "CS 4670",
    title: "Introduction to Computer Vision",
    credits: 4,
    dept: "CS",
    level: 4670,
    summary:
      "Reconstruction, recognition, and the optimization behind modern vision systems.",
    terms: ["spring"],
    prereqs: all(oop, discrete, req("MATH 1920"), any(req("MATH 2310"), req("MATH 2940"))),
    workload: 5,
    interests: ["vision", "machine-learning"],
    skills: ["3D reconstruction", "Recognition", "Optimization"],
    tracks: { ai: "track" },
    note: "Requires multivariable calculus (MATH 1920) and engineering linear algebra or MATH 2310. The arts calculus sequence does not unlock it.",
  }),
  defineCourse({
    id: "CS 4701",
    title: "Practicum in Artificial Intelligence",
    credits: 2,
    dept: "CS",
    level: 4701,
    summary: "A student-driven AI build. Counts as the practicum, not as a 3-credit elective.",
    terms: ["fall", "spring"],
    prereqs: any(req("CS 3700"), req("CS 3780"), req("CS 4670"), req("CS 4740"), req("ECE 4200")),
    workload: 3,
    interests: ["reasoning", "machine-learning"],
    skills: ["Applied AI", "Project scoping"],
    tracks: { ai: "track" },
    practicum: true,
  }),
  defineCourse({
    id: "CS 4740",
    title: "Natural Language Processing",
    credits: 4,
    dept: "CS",
    level: 4740,
    summary:
      "Language models, tagging, parsing, and evaluation. A heavy project course that counts as the practicum.",
    terms: ["spring"],
    prereqs: null,
    recommended: ["CS 2110", "CS 2800"],
    workload: 5,
    interests: ["nlp", "machine-learning"],
    skills: ["Text models", "Evaluation", "Sequence learning"],
    tracks: { ai: "track", data: "track" },
    practicum: true,
    note: "The catalog does not list a formal prerequisite. Plan on CS 2110 and CS 2800, and do not stack it on another heavy course.",
  }),
  defineCourse({
    id: "CS 4750",
    title: "Foundations of Robotics",
    credits: 4,
    dept: "CS",
    level: 4750,
    summary:
      "Kinematics, estimation, planning, and control for physical robots.",
    terms: ["fall"],
    prereqs: all(req("CS 1112"), oop, discrete, req("MATH 1920"), req("MATH 2940")),
    workload: 4,
    interests: ["robotics"],
    skills: ["Kinematics", "State estimation", "Motion planning"],
    tracks: { ai: "track" },
    note: "The catalog asks for CS 1112, MATH 1920, and MATH 2940. CS 1110 does not substitute.",
  }),
  defineCourse({
    id: "CS 4782",
    title: "Introduction to Deep Learning",
    credits: 4,
    dept: "CS",
    level: 4782,
    summary: "How deep networks train, and which architectures fit vision and language.",
    terms: ["spring"],
    prereqs: all(oop, any(req("CS 3780"), req("ECE 4200"), req("STSCI 3740")), intro),
    workload: 4,
    interests: ["deep-learning", "machine-learning"],
    skills: ["Neural nets", "Training", "Architectures"],
    tracks: { ai: "track", data: "track" },
  }),
  defineCourse({
    id: "CS 4787",
    title: "Principles of Large-Scale Machine Learning Systems",
    credits: 4,
    dept: "CS",
    level: 4787,
    summary:
      "How training stays fast on large data: SGD, batching, parallelism, and compression.",
    terms: ["fall"],
    prereqs: all(any(req("CS 3780"), req("CS 5780")), oop),
    workload: 4,
    interests: ["machine-learning", "systems"],
    skills: ["SGD", "Distributed training", "Systems for ML"],
    tracks: { ai: "track", data: "track" },
  }),
  defineCourse({
    id: "CS 4789",
    title: "Introduction to Reinforcement Learning",
    credits: 3,
    dept: "CS",
    level: 4789,
    summary: "Markov decision processes, planning, and the classic reinforcement-learning algorithms.",
    terms: ["fall"],
    prereqs: req("CS 3780"),
    workload: 3,
    interests: ["reinforcement", "machine-learning"],
    skills: ["MDPs", "Policy learning", "Exploration"],
    tracks: { ai: "track", data: "track" },
  }),
  defineCourse({
    id: "CS 4820",
    title: "Introduction to Analysis of Algorithms",
    credits: 4,
    dept: "CS",
    level: 4820,
    summary:
      "Greedy algorithms, divide and conquer, dynamic programming, flows, and NP-completeness.",
    terms: ["fall", "spring"],
    prereqs: all(discrete, req("CS 3110")),
    workload: 5,
    interests: ["reasoning"],
    skills: ["Algorithm design", "Proofs of correctness", "Reductions"],
    tracks: allTracks,
    note: "A high grade in CS 2110 can sometimes replace CS 3110. This planner uses the usual 3110 prerequisite.",
  }),
  defineCourse({
    id: "CS 4850",
    title: "Probability, Vectors, and Matrices in Computing",
    credits: 4,
    dept: "CS",
    level: 4850,
    summary:
      "High-dimensional probability and linear algebra for data and learning. Fills the major's probability requirement.",
    terms: ["spring"],
    prereqs: all(discrete, req("MATH 1910"), req("MATH 1920"), any(req("MATH 2210"), req("MATH 2940"))),
    workload: 4,
    interests: ["probability", "machine-learning"],
    skills: ["High-dimensional probability", "SVD", "Random graphs"],
    tracks: { data: "track", ai: "track" },
    note: "Needs the engineering calculus sequence. Arts calculus (1110, 1120, 2210) does not unlock it.",
  }),
  defineCourse({
    id: "CS 5150",
    title: "Software Engineering",
    credits: 4,
    dept: "CS",
    level: 5150,
    summary:
      "Specify, build, review, and ship a feature in a real codebase with a team.",
    terms: ["spring"],
    prereqs: oop,
    workload: 4,
    interests: ["software-design", "testing"],
    skills: ["Code review", "Agile teams", "Release process"],
    tracks: { software: "track" },
    practicum: true,
    grad: true,
    note: "Counts as a practicum. Enrollment is limited to M.Eng. students.",
  }),
  defineCourse({
    id: "CS 5154",
    title: "Software Testing",
    credits: 3,
    dept: "CS",
    level: 5154,
    summary: "Test design, coverage, automation, and debugging for real codebases.",
    terms: ["fall"],
    prereqs: any(req("CS 3110"), req("CS 4120")),
    workload: 3,
    interests: ["testing", "software-design"],
    skills: ["Test design", "Coverage", "Debugging"],
    tracks: { software: "track" },
  }),
  defineCourse({
    id: "CS 5414",
    title: "Distributed Computing Principles",
    credits: 4,
    dept: "CS",
    level: 5414,
    summary:
      "Time, agreement, replication, and failure, plus a large distributed-systems project. Counts as a practicum.",
    terms: ["fall"],
    prereqs: req("CS 4410"),
    workload: 4,
    interests: ["distributed", "systems"],
    skills: ["Consensus", "Replication", "Fault tolerance"],
    tracks: { systems: "track" },
    practicum: true,
    note: "Advanced. Often taken by seniors and M.Eng. students after operating systems.",
  }),
  defineCourse({
    id: "CS 5430",
    title: "System Security",
    credits: 4,
    dept: "CS",
    level: 5430,
    summary:
      "Cryptography, authorization, and the arguments that a system meets a security policy.",
    terms: ["spring"],
    prereqs: req("CS 4410"),
    workload: 4,
    interests: ["security", "systems"],
    skills: ["Threat modeling", "Cryptographic protocols", "Access control"],
    tracks: { systems: "track" },
    grad: true,
    note: "Enrollment is limited to M.Eng. students.",
  }),
  defineCourse({
    id: "INFO 2950",
    title: "Introduction to Data Science",
    credits: 4,
    dept: "INFO",
    level: 2950,
    summary:
      "Applied data science in Python or R: wrangling, regression, testing ideas, and presenting a result.",
    terms: ["fall"],
    prereqs: intro,
    workload: 4,
    interests: ["data-viz", "databases"],
    skills: ["Data wrangling", "Regression", "Visualization"],
    tracks: { data: "track" },
    note: "The catalog also expects an introductory statistics course such as MATH 1710.",
  }),
  defineCourse({
    id: "MATH 1110",
    title: "Calculus I",
    credits: 4,
    dept: "MATH",
    level: 1110,
    summary: "Differential calculus. The arts-college start of the math core.",
    terms: ["fall", "spring"],
    prereqs: null,
    workload: 3,
    interests: [],
    skills: ["Derivatives", "Limits"],
    tracks: allTracks,
  }),
  defineCourse({
    id: "MATH 1120",
    title: "Calculus II",
    credits: 4,
    dept: "MATH",
    level: 1120,
    summary: "Integral calculus and series. Arts-college second calculus course.",
    terms: ["fall", "spring"],
    prereqs: req("MATH 1110"),
    workload: 3,
    interests: [],
    skills: ["Integration", "Series"],
    tracks: allTracks,
  }),
  defineCourse({
    id: "MATH 2210",
    title: "Linear Algebra",
    credits: 4,
    dept: "MATH",
    level: 2210,
    summary: "Vector spaces and matrices. Arts-college linear algebra for the major.",
    terms: ["fall", "spring"],
    prereqs: calc2,
    workload: 3,
    interests: [],
    skills: ["Matrices", "Vector spaces"],
    tracks: allTracks,
  }),
  defineCourse({
    id: "MATH 1910",
    title: "Calculus for Engineers",
    credits: 4,
    dept: "MATH",
    level: 1910,
    summary: "Engineering differential calculus, placed by exam or prior credit.",
    terms: ["fall", "spring"],
    prereqs: null,
    workload: 3,
    interests: [],
    skills: ["Derivatives", "Modeling"],
    tracks: allTracks,
    note: "Engineering-college calculus. Placement or prior credit decides where you start.",
  }),
  defineCourse({
    id: "MATH 1920",
    title: "Multivariable Calculus for Engineers",
    credits: 4,
    dept: "MATH",
    level: 1920,
    summary: "Multivariable calculus. Required for vision, robotics, and CS 4850.",
    terms: ["fall", "spring"],
    prereqs: req("MATH 1910"),
    workload: 3,
    interests: [],
    skills: ["Multivariable calculus", "Vector calculus"],
    tracks: allTracks,
  }),
  defineCourse({
    id: "MATH 2940",
    title: "Linear Algebra for Engineers",
    credits: 4,
    dept: "MATH",
    level: 2940,
    summary: "Engineering linear algebra. Unlocks machine learning and the vision and robotics electives.",
    terms: ["fall", "spring"],
    prereqs: req("MATH 1920"),
    workload: 3,
    interests: [],
    skills: ["Matrices", "Eigenvalues"],
    tracks: allTracks,
  }),
];

export const courseMap = new Map(courses.map((course) => [course.id, course]));

export function getCourse(id: string): Course | undefined {
  return courseMap.get(id);
}

export const overlapGroups: { ids: string[]; reason: string }[] = [
  {
    ids: ["CS 1110", "CS 1112"],
    reason: "CS 1110 and CS 1112 fill the same introductory requirement.",
  },
  {
    ids: ["CS 2110", "CS 2112"],
    reason: "CS 2110 and CS 2112 fill the same data-structures requirement.",
  },
  {
    ids: ["CS 2800", "CS 2802"],
    reason: "CS 2800 and CS 2802 fill the same discrete-math requirement.",
  },
  {
    ids: ["CS 3410", "CS 3420"],
    reason: "CS 3410 and CS 3420 fill the same computer-organization requirement.",
  },
  {
    ids: ["CS 4410", "CS 4414"],
    reason: "CS 4410 and CS 4414 fill the same operating-systems requirement.",
  },
  {
    ids: ["MATH 1110", "MATH 1910"],
    reason: "MATH 1110 and MATH 1910 fill the same first-calculus requirement.",
  },
  {
    ids: ["MATH 1120", "MATH 1920"],
    reason: "MATH 1120 and MATH 1920 fill the same second-calculus requirement.",
  },
  {
    ids: ["MATH 2210", "MATH 2940"],
    reason: "MATH 2210 and MATH 2940 fill the same linear-algebra requirement.",
  },
];

export const mathByCollege: Record<College, Record<MathSlot, string>> = {
  arts: { calc1: "MATH 1110", calc2: "MATH 1120", linalg: "MATH 2210" },
  engineering: { calc1: "MATH 1910", calc2: "MATH 1920", linalg: "MATH 2940" },
};

export const tracks: Track[] = [
  {
    id: "software",
    name: "Software engineering",
    summary:
      "Design, test, and ship larger programs. The sequence runs through functional programming, databases, testing, and a senior build.",
    outcomes: [
      "Read and change a codebase bigger than a course assignment",
      "Choose data models and tests with a reason",
      "Ship one substantial system: a database piece, a compiler, or a game",
    ],
    constraints: [
      "CS 3110 is the design gate. Testing and compilers both wait for it.",
      "CS 3110 and CS 3410 are each heavy, so they sit in different semesters.",
      "The compiler practicum is spring-only and shares a semester with CS 4120.",
      "Take CS 4411 with CS 4410, and do not add compilers that same spring.",
    ],
    later: "CS 5150 is the M.Eng. studio version of this track. Enrollment is limited to M.Eng. students.",
    defaultInterests: ["software-design", "databases", "compilers"],
    terms: [
      [
        {
          kind: "courses",
          ids: ["CS 1110"],
          why: "A full programming course. CS 1112 is the alternative if you want the scientific intro.",
        },
        { kind: "math", slot: "calc1", why: "Calculus opens discrete math and, later, machine learning." },
      ],
      [
        {
          kind: "courses",
          ids: ["CS 2110"],
          why: "Object-oriented design and the data structures every later course assumes.",
        },
        { kind: "math", slot: "calc2", why: "Second calculus course, before linear algebra." },
        {
          kind: "courses",
          ids: ["CS 2043"],
          why: "Unix and scripting, while the semester is not yet full of cores.",
        },
      ],
      [
        {
          kind: "courses",
          ids: ["CS 2800"],
          why: "Discrete math a semester after CS 2110, so the two demanding intros are split.",
        },
        {
          kind: "courses",
          ids: ["CS 3410"],
          why: "Organization is the gate for operating systems and compilers.",
        },
        { kind: "math", slot: "linalg", why: "Finishes the math core." },
      ],
      [
        {
          kind: "courses",
          ids: ["CS 3110"],
          why: "The software-design gate. Algorithms, testing, and compilers sit behind it.",
        },
        {
          kind: "courses",
          ids: ["CS 3700"],
          why: "Fills the AI core without the heavier machine-learning prerequisite stack.",
        },
      ],
      [
        {
          kind: "courses",
          ids: ["CS 4820"],
          why: "Algorithms as soon as CS 3110 is done, with the rest of the semester kept lighter.",
        },
        {
          kind: "courses",
          ids: ["CS 4320", "CS 4321"],
          why: "Database systems and its practicum. CS 4321 may be taken with CS 4320.",
        },
      ],
      [
        {
          kind: "courses",
          ids: ["CS 4410", "CS 4411"],
          why: "Operating systems and its practicum share the spring. Leave the rest of the semester open.",
        },
      ],
      [
        {
          kind: "courses",
          ids: ["CS 5154"],
          why: "Testing is a fall course and wants CS 3110 already finished.",
        },
        {
          kind: "pick",
          why: "One fall depth course beside testing.",
          options: [
            { ids: ["CS 4420"], interests: ["architecture"], label: "Computer architecture" },
            { ids: ["CS 4620"], interests: ["graphics"], label: "Computer graphics" },
            { ids: ["CS 3300"], interests: ["data-viz"], label: "Visual data analytics" },
          ],
        },
      ],
      [
        {
          kind: "pick",
          why: "Spring capstone. Compilers is the default for this track.",
          options: [
            {
              ids: ["CS 4120", "CS 4121"],
              interests: ["compilers", "software-design"],
              label: "Compilers",
            },
            { ids: ["CS 3152"], interests: ["game"], label: "Game architecture" },
            { ids: ["CS 4450"], interests: ["networks"], label: "Computer networks" },
          ],
        },
      ],
    ],
  },
  {
    id: "ai",
    name: "Artificial intelligence",
    summary:
      "Reach machine learning as soon as the math allows, then pick language, vision, robotics, or learning systems that your prerequisites actually unlock.",
    outcomes: [
      "Train and evaluate a supervised model and explain what it assumes",
      "Choose a depth course — language, vision, robotics, or reinforcement learning — that fits your math",
      "Ship an AI practicum after the core, not before it",
    ],
    constraints: [
      "CS 3780 needs calculus, linear algebra, and CS 2800. It cannot move in front of those.",
      "CS 4782 and CS 4787 both sit on top of CS 3780.",
      "Vision (CS 4670) and robotics (CS 4750) expect the engineering math sequence. Arts calculus leaves them locked.",
      "CS 4701 is the short practicum. Take it with or after CS 3780.",
    ],
    later: "Further theory courses such as CS 4783 sit on CS 3780 and CS 4820 after this sequence.",
    defaultInterests: ["machine-learning", "reasoning"],
    terms: [
      [
        { kind: "courses", ids: ["CS 1110"], why: "Programming foundation for every later AI course." },
        { kind: "math", slot: "calc1", why: "Required before discrete math and machine learning." },
      ],
      [
        { kind: "courses", ids: ["CS 2110"], why: "Data structures used in the ML and AI cores." },
        { kind: "courses", ids: ["CS 2800"], why: "Proofs and probability vocabulary for CS 3780." },
        { kind: "math", slot: "calc2", why: "Finish the second calculus course before linear algebra." },
      ],
      [
        {
          kind: "courses",
          ids: ["CS 3410"],
          why: "Organization, kept out of the same semester as CS 3110.",
        },
        { kind: "math", slot: "linalg", why: "A hard prerequisite for CS 3780." },
      ],
      [
        { kind: "courses", ids: ["CS 3110"], why: "Needed for algorithms, and taken after CS 3410 rather than beside it." },
        {
          kind: "courses",
          ids: ["CS 3780"],
          why: "The machine-learning gate. Deep learning and large-scale ML both require it.",
        },
      ],
      [
        {
          kind: "courses",
          ids: ["CS 4787"],
          why: "Fall course on training at scale, the first semester after CS 3780.",
        },
        { kind: "courses", ids: ["CS 4701"], why: "AI practicum once CS 3780 is already done." },
        {
          kind: "pick",
          why: "A third fall course matched to the kind of AI you want.",
          options: [
            { ids: ["CS 3700"], interests: ["reasoning"], label: "AI reasoning" },
            { ids: ["CS 4750"], interests: ["robotics"], label: "Robotics" },
            { ids: ["CS 4789"], interests: ["reinforcement"], label: "Reinforcement learning" },
          ],
        },
      ],
      [
        {
          kind: "courses",
          ids: ["CS 4820"],
          why: "Algorithms after CS 3110, not stacked on another heavy elective.",
        },
        { kind: "courses", ids: ["CS 4410"], why: "Operating-systems core, in the spring it is offered." },
      ],
      [
        {
          kind: "pick",
          why: "Senior fall depth once the ML gate is open.",
          options: [
            { ids: ["CS 4789"], interests: ["reinforcement"], label: "Reinforcement learning" },
            { ids: ["CS 4750"], interests: ["robotics"], label: "Robotics" },
            { ids: ["CS 4320", "CS 4321"], interests: ["databases"], label: "Database systems" },
          ],
        },
      ],
      [
        {
          kind: "pick",
          why: "Senior spring application course.",
          options: [
            { ids: ["CS 4782"], interests: ["machine-learning", "deep-learning"], label: "Deep learning" },
            { ids: ["CS 4740"], interests: ["nlp"], label: "Natural language processing" },
            { ids: ["CS 4670"], interests: ["vision"], label: "Computer vision" },
          ],
        },
      ],
    ],
  },
  {
    id: "systems",
    name: "Systems",
    summary:
      "Follow the machine from organization through architecture, operating systems, networks, and distributed systems, with compilers as a spring capstone.",
    outcomes: [
      "Explain what a program asks of the processor, memory, and operating system",
      "Build a kernel piece and a distributed system that survives failure",
      "Read a network protocol and a compiler as engineered artifacts",
    ],
    constraints: [
      "CS 3410 comes before operating systems, architecture, networks, and compilers.",
      "CS 4411 shares a semester with CS 4410. That spring stays otherwise empty.",
      "Architecture (CS 4420) and distributed systems (CS 5414) are fall courses.",
      "Compilers need both CS 3110 and CS 3410, and they are spring-only.",
    ],
    later: "CS 5430 System Security continues the track in the M.Eng. program, after operating systems.",
    defaultInterests: ["systems", "architecture", "distributed"],
    terms: [
      [
        { kind: "courses", ids: ["CS 1110"], why: "Programming foundation." },
        { kind: "math", slot: "calc1", why: "Starts the math core." },
      ],
      [
        { kind: "courses", ids: ["CS 2110"], why: "Required before organization and discrete math's programming pair." },
        { kind: "courses", ids: ["CS 2800"], why: "Discrete math, taken with CS 2110 only because later systems courses stack harder." },
        { kind: "math", slot: "calc2", why: "Second calculus course." },
      ],
      [
        {
          kind: "courses",
          ids: ["CS 3410"],
          why: "The systems gate. Everything signature in this track waits on it.",
        },
        { kind: "math", slot: "linalg", why: "Finishes the math core before the AI requirement." },
      ],
      [
        { kind: "courses", ids: ["CS 3110"], why: "Needed for algorithms and compilers, after organization rather than beside it." },
        {
          kind: "courses",
          ids: ["CS 4450"],
          why: "Networks in the spring, once CS 3410 is done.",
        },
      ],
      [
        { kind: "courses", ids: ["CS 4420"], why: "Architecture is fall-only and wants CS 3410 first." },
        { kind: "courses", ids: ["CS 3700"], why: "Fills the AI core in a semester that already has a heavy architecture course." },
      ],
      [
        {
          kind: "courses",
          ids: ["CS 4410", "CS 4411"],
          why: "Operating systems and the kernel practicum. No second project this spring.",
        },
      ],
      [
        { kind: "courses", ids: ["CS 4820"], why: "Algorithms in senior fall, after the OS project rather than during it." },
        {
          kind: "courses",
          ids: ["CS 5414"],
          why: "Distributed systems once CS 4410 is finished. Also counts as a practicum.",
        },
      ],
      [
        {
          kind: "pick",
          why: "Spring capstone after operating systems.",
          options: [
            {
              ids: ["CS 4120", "CS 4121"],
              interests: ["compilers", "software-design"],
              label: "Compilers",
            },
            { ids: ["CS 5430"], interests: ["security"], label: "System security" },
            { ids: ["CS 3152"], interests: ["game"], label: "Game architecture" },
          ],
        },
      ],
    ],
  },
  {
    id: "data",
    name: "Data",
    summary:
      "Pair applied data science with databases and machine learning, and use CS 4414 when you want the systems core aimed at ML workloads.",
    outcomes: [
      "Turn a messy dataset into a claim you can defend",
      "Know how a database stores and queries that data",
      "Train a model and understand the systems cost of doing it at scale",
    ],
    constraints: [
      "INFO 2950 is the applied data gate and is usually offered in fall.",
      "CS 3780 unlocks large-scale ML (fall) and deep learning (spring).",
      "Database systems are fall-only and need CS 2110 plus CS 2800, so they can sit beside ML.",
      "CS 4414 fills the operating-systems requirement with a focus on running ML systems. It is usually fall and needs CS 3410.",
    ],
    later: "CS 4850 fills the probability requirement if you take engineering calculus (1910, 1920, and 2940). Otherwise leave a semester open for STSCI 3080, MATH 4710, ECON 3130, ECE 3100, or ENGRD 2700.",
    defaultInterests: ["databases", "machine-learning", "data-viz"],
    terms: [
      [
        { kind: "courses", ids: ["CS 1110"], why: "Programming, including the prerequisite for INFO 2950." },
        { kind: "math", slot: "calc1", why: "Starts the math that machine learning will ask for." },
      ],
      [
        { kind: "courses", ids: ["CS 2110"], why: "Data structures for databases and machine learning." },
        { kind: "courses", ids: ["CS 2800"], why: "Discrete math and the probability option inside CS 3780." },
        { kind: "math", slot: "calc2", why: "Second calculus course, before linear algebra." },
      ],
      [
        {
          kind: "courses",
          ids: ["INFO 2950"],
          why: "Applied data science while the CS cores are still ramping up. Usually fall.",
        },
        { kind: "courses", ids: ["CS 3410"], why: "Organization, required before the systems core." },
        { kind: "math", slot: "linalg", why: "Linear algebra before CS 3780." },
      ],
      [
        { kind: "courses", ids: ["CS 3110"], why: "Needed for algorithms. Placed after CS 3410." },
        { kind: "courses", ids: ["CS 3780"], why: "Machine-learning gate for the rest of the data sequence." },
      ],
      [
        {
          kind: "courses",
          ids: ["CS 4320", "CS 4321"],
          why: "How data is stored and queried, with the practicum in the same fall.",
        },
        {
          kind: "courses",
          ids: ["CS 4787"],
          why: "Large-scale training, the fall after CS 3780.",
        },
      ],
      [
        { kind: "courses", ids: ["CS 4820"], why: "Algorithms. Kept to one heavy course by choosing a lighter ML elective beside it." },
        {
          kind: "pick",
          why: "A spring ML elective that does not stack a second heavy project on algorithms unless you choose language.",
          options: [
            { ids: ["CS 4782"], interests: ["machine-learning", "deep-learning"], label: "Deep learning" },
            { ids: ["CS 4740"], interests: ["nlp"], label: "Natural language processing" },
            { ids: ["CS 4850"], interests: ["probability"], label: "Probability for computing" },
          ],
        },
      ],
      [
        {
          kind: "courses",
          ids: ["CS 4414"],
          why: "Systems core aimed at how ML applications run. Usually fall, after CS 3410.",
        },
        {
          kind: "pick",
          why: "A lighter fall course beside systems programming.",
          options: [
            { ids: ["CS 3300"], interests: ["data-viz"], label: "Visual data analytics" },
            { ids: ["CS 4789"], interests: ["reinforcement"], label: "Reinforcement learning" },
          ],
        },
      ],
      [
        {
          kind: "pick",
          why: "Close the sequence with the data elective you have not taken yet.",
          options: [
            { ids: ["CS 4740"], interests: ["nlp"], label: "Natural language processing" },
            { ids: ["CS 4782"], interests: ["machine-learning", "deep-learning"], label: "Deep learning" },
            { ids: ["CS 4850"], interests: ["probability"], label: "Probability for computing" },
          ],
        },
      ],
    ],
  },
];

export const trackMap = new Map(tracks.map((track) => [track.id, track]));

export const trackOrder: TrackId[] = ["software", "ai", "systems", "data"];

export function mathIds(college: College): string[] {
  const row = mathByCollege[college];
  return [row.calc1, row.calc2, row.linalg];
}
