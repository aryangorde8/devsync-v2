/**
 * GSAP Configuration with all plugins
 * Import this file once in your app to register all plugins
 */

import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

// Easing plugins
import { CustomEase } from "gsap/CustomEase";
import { CustomBounce } from "gsap/CustomBounce";
import { CustomWiggle } from "gsap/CustomWiggle";
import { RoughEase, ExpoScaleEase, SlowMo } from "gsap/EasePack";

// Core plugins
import { Draggable } from "gsap/Draggable";
import { Flip } from "gsap/Flip";
import { Observer } from "gsap/Observer";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";

// Scroll plugins
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";

// Text plugins
import { TextPlugin } from "gsap/TextPlugin";
import { SplitText } from "gsap/SplitText";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";

// SVG plugins
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";

// Physics plugins
import { Physics2DPlugin } from "gsap/Physics2DPlugin";
import { PhysicsPropsPlugin } from "gsap/PhysicsPropsPlugin";
import { InertiaPlugin } from "gsap/InertiaPlugin";

// Dev tools
import { GSDevTools } from "gsap/GSDevTools";
import { MotionPathHelper } from "gsap/MotionPathHelper";

// Register all plugins
gsap.registerPlugin(
  useGSAP,
  // Easing
  CustomEase,
  CustomBounce,
  CustomWiggle,
  RoughEase,
  ExpoScaleEase,
  SlowMo,
  // Core
  Draggable,
  Flip,
  Observer,
  MotionPathPlugin,
  // Scroll
  ScrollTrigger,
  ScrollSmoother,
  ScrollToPlugin,
  // Text
  TextPlugin,
  SplitText,
  ScrambleTextPlugin,
  // SVG
  DrawSVGPlugin,
  MorphSVGPlugin,
  // Physics
  Physics2DPlugin,
  PhysicsPropsPlugin,
  InertiaPlugin,
  // Dev tools (only in development)
  ...(process.env.NODE_ENV === 'development' ? [GSDevTools, MotionPathHelper] : [])
);

// Export everything for easy imports
export {
  gsap,
  useGSAP,
  // Easing
  CustomEase,
  CustomBounce,
  CustomWiggle,
  RoughEase,
  ExpoScaleEase,
  SlowMo,
  // Core
  Draggable,
  Flip,
  Observer,
  MotionPathPlugin,
  // Scroll
  ScrollTrigger,
  ScrollSmoother,
  ScrollToPlugin,
  // Text
  TextPlugin,
  SplitText,
  ScrambleTextPlugin,
  // SVG
  DrawSVGPlugin,
  MorphSVGPlugin,
  // Physics
  Physics2DPlugin,
  PhysicsPropsPlugin,
  InertiaPlugin,
  // Dev tools
  GSDevTools,
  MotionPathHelper,
};

export default gsap;
