import express from 'express';

const apiRouter = express.Router();

// Simulate registering a route
apiRouter.post("/project-submissions", (req, res) => {
  res.json({ test: "works" });
});

// Check what routes are registered
console.log("Routes registered:");
apiRouter.stack.forEach((r) => {
  if (r.route) {
    console.log(`${Object.keys(r.route.methods)} ${r.route.path}`);
  }
});
