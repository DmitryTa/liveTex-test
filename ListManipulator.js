class  ListManipulator {
	constructor(data) {
		this.data = data || {};
	}
	// null получает приоритет некорректно, поскольку pos  == null 
	set(channel, newPos) {
		if(!this.data.hasOwnProperty(channel)) return;

		let obj = this.data,
			pos = obj[channel];
		obj[channel] = newPos;

		Object.keys(obj)
			.forEach((key)=> {
				if (key === channel || obj[key] === null) return;

				if (pos > newPos) {
					if (obj[key] < newPos || obj[key] > pos) return;
					obj[key]++;
				} else {
					if (obj[key] < pos || obj[key] > newPos) return;
					obj[key]--;
				}
			});
		return obj;
	}
	// pos должен автоматом присваиваться 
	// при добавлении - всегда ?
	add(channel, pos) {
		if(this.data.hasOwnProperty(channel)) return;
		var pos = pos || null;
		if (pos) {
			Object.keys(this.data).forEach((key)=> {
				if (this.data[key] === null || this.data[key] < pos) return;
				this.data[key]++;	
			});
		}
		this.data[channel] = pos;
		return this.data;
	}

	remove(channel) {
		if(!this.data.hasOwnProperty(channel)) return;
		
		if (this.data[channel] !== null) {
			Object.keys(this.data).forEach((key)=> {
				if (this.data[key] > this.data[channel]) {
					this.data[key]--;	
				}
			});
		}
		delete this.data[channel];
		return this.data;
	}

}

data = {
	site: 2,
	sdk: 0,
	vk: 1,
	od: 3
}

let list = new ListManipulator(data);