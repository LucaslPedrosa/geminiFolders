class queue {

  constructor() {
    this.tail = 0;
    this.head = 0;
    this.q = {};
  };

  in(v) {
    this.q[this.tail] = v;
    tail++;
    tail = tail % size;
  };

  isEmpty() {
    return this.tail === this.head;
  };

  pop() {
    if (this.isEmpty()) return undefined;
    const item = this.q[this.head];
    delete this.q[this.head];
    this.head++;
    return item;
  }
}

export default queue;
