if(!dconnect) dconnect = {};
if(!dconnect.init) dconnect.init = {};
dconnect.init.random = (function() {
  this.Random = function Random(seed) {
     this._seed = seed % 2147483647;
     if (this._seed <= 0) this._seed += 2147483646;
  }

  this.Random.prototype.next = function() {
     return this._seed = this._seed * 16807 % 2147483647;
  };

  this.Random.prototype.nextFloat = function(opt_minOrMax, opt_max) {
     // We know that result of next() will be 1 to 2147483646 (inclusive).
     return (this.next() - 1) / 2147483646;
  };

  this.pickFromArray = function pickFromArray(iarray) {
    var randomIndex = Math.floor(Math.random() * iarray.length); 
    return iarray[randomIndex];
  }

  this.getHash = function getHash(path) {
     const random = new this.Random(this.hashCode(path.toString().split('#')[0]));
     const id = this.randomString(random);
     return id;
  }

  this.hashCode = function hashCode(s) {
     let h = 0,
         l = s.length,
         i = 0;
     if (l > 0)
         while (i < l)
             h = (h << 5) - h + s.charCodeAt(i++) | 0;
     return h;
  };

  this.randomString = function randomString(inputRandom) {
     let chars = "abcdefghiklmnopqrstuvwxyz12345";
     let string_length = 12;
     let randomstring = '';
     for (let i = 0; i < string_length; i++) {
         const next = inputRandom.nextFloat(0, 1);
         let rnum = Math.floor(next * chars.length);
         randomstring += chars.substring(rnum, rnum + 1);
     }
     return randomstring;
  }
}).bind(dconnect);
dconnect.init.random();