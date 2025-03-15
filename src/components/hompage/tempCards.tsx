import { Project } from "@prisma/client";
import Link from "next/link";
import React from "react";
import { Button } from "../ui/button";

const TempCards = ({ project }: { project?: Project }) => {
  if (!project) {
    return <div>No project found</div>;
  }

  return (
    <Link href={`/editor/${project.id}`}>
      <Button className="bg-white text-purple-600 transition duration-300 hover:bg-purple-100">
        <h1>{project.name}</h1>
      </Button>
    </Link>
  );
};

export default TempCards;
