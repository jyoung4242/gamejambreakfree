if (en.patrolState == "idle") {
  console.log(`${en.sid} setting up new patrol`);
  let isGood = false;
  let targetCoords: number[];
  do {
    const deltaX = chance.integer({ min: -5, max: 5 });
    const deltaY = chance.integer({ min: -5, max: 5 });
    console.log(`${en.sid}: delta x,y: ${deltaX}, ${deltaY},   current coords: ${en.currentCoords[0]}, ${en.currentCoords[1]}`);

    targetCoords = [en.currentCoords[0] + deltaX, en.currentCoords[1] + deltaY];
    console.log(`${en.sid}: target coords: ${targetCoords[0]},${targetCoords[1]}}`);

    if (isPatrolTileReachable(room.map as number[][], en.currentCoords[0], en.currentCoords[1], targetCoords[0], targetCoords[1]))
      isGood = true;

    // is targetCoords reachable
  } while (!isGood);

  console.log(`${en.sid} found path, ${targetCoords[0]},${targetCoords[1]}`);
  //get path to that spot
  const enemyPatrol = new EnemyPatrol(
    room.map as number[][],
    { x: en.currentCoords[0], y: en.currentCoords[1] },
    { x: targetCoords[0], y: targetCoords[1] }
  );

  const patrolPath = enemyPatrol.findPatrolPath();
  console.log("patrol path", patrolPath);
  en.patrolPath = patrolPath;
  en.patrolIndex = 0;

  //set amount to move, direction, and state
  //TODO
} else if (en.patrolstate == "inprogress") {
  //move to next point
  en.patrolIndex++;
  //TODO
}
