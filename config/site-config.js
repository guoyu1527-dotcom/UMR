window.PAPER_CONTENT = {
  titleHtml: "UMR: Universal Manipulation Representation",
  authorsHtml: `
    <span class="author-block">Anonymous Authors</span>
  `,
  affiliationHtml: `Anonymous Institution`,
  affiliationNoteHtml: `Submitted for double-blind review`,
  venueHtml: `ICRA Submission`,
  awardHtml: `Zero-shot cross-embodiment manipulation from human demonstrations`,
  links: {
    pdf: "media/UMR_manuscript.pdf",
    arxiv: "#",
    explainer: "#",
    talk: "#",
    tldr: "#",
    code: "#",
    data1: "UMR_NEW/pixel_filter_review_20260906_v1_bundle/index.html",
    data2: "media/videos/dataset-manifest.json",
    checkpoints: "#"
  },
  teaserCaption: "UMR represents manipulation as coupled World-Flow and Ego-Trajectory, allowing task motion learned from human demonstrations to transfer to heterogeneous robots and spatially shifted scenes.",
  abstractHtml: `General-purpose embodied manipulation hinges on a unified action representation that generalizes across embodiments and scales with heterogeneous demonstrations. Existing policies rely on embodiment-specific action spaces, making human and robot demonstrations difficult to share directly. We introduce <strong>Universal Manipulation Representation (UMR)</strong>, a unified geometric action representation that enables zero-shot skill transfer from human demonstrations to heterogeneous robots. UMR decomposes manipulation into two geometry-linked components: embodiment-agnostic <strong>World-Flow</strong>, which describes task-relevant object motion in the world frame, and <strong>Ego-Trajectory</strong>, which represents end-effector motion relative to the current pose. We instantiate UMR as <strong>World-Ego Point VLA (WEP-VLA)</strong>, a compact 0.5B-parameter point-cloud VLA with a dual-stream Point Action Adapter and a unified Point Action Expert. In simulation, WEP-VLA reaches 85.7% on RLBench and 97.5% on LIBERO. In real-world experiments, policies trained from human demonstrations transfer zero-shot across embodiments, grasp configurations, and spatial perturbations.`,
  walkthroughMode: "local",
  walkthroughYoutubeEmbed: "https://www.youtube-nocookie.com/embed/VIDEO_ID",
  interactiveIntroHtml: `Explore RH20T point-cloud examples derived from the UMR preprocessing pipeline. Each scene compares a single-view pixel-filtered point cloud against a multiview reconstruction for the same frame.`,
  interactiveNoteHtml: `<strong>NOTE:</strong> The interactive viewer uses exported PLY review samples. Prediction shows single-view filtering; the reference viewer shows multiview reconstruction.`,
  datasetTitleHtml: `World-Ego Point Cloud Review`,
  datasetIntro1Html: `The review bundle covers cfg2-cfg7 RH20T episodes and exports aligned RGB frames, image-space comparisons, and binary PLY point clouds for visual inspection.`,
  datasetIntro2Html: `For each selected episode, the site loads the same frame as two coupled 3D views: single-view filtering and multiview reconstruction. This makes geometry, density, and virtual-gripper consistency easy to inspect before release.`,
  experimentsIntroHtml: `UMR targets manipulation under embodiment changes, spatial perturbations, tool use, and quasi-rigid object interaction. The media below shows representative evaluation episodes.`
};
