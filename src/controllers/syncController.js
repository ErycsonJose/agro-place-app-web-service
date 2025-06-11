import admin from '../../firebase.js';

// Sincronizar do backend para o Firestore
export const syncToServer = async (req,res)=>{
    const { tableName, data } = req.body;
    try {
    const batch = admin.firestore().batch();
    data.forEach(row => {
        const { id, ...dataWithoutId } = row;
        const docRef = admin.firestore().collection(tableName).doc(id);
        batch.set(docRef, dataWithoutId);
    });
    await batch.commit();
    res.json({ success: true });
    } catch (error) {
    res.status(500).json({ error: error.message });
    }
}

// Sincronizar do Firestore para o backend
export const syncFromServer = async (req,res) => {
    const { tableName } = req.params;
    const {id, filters } = req.query;

    try {
        let data = [];

        if(id){
            const docSnap = await admin.firestore().collection(tableName).doc(id).get();
            if(docSnap.exists){
                data.push({id: docSnap.id, ...docSnap.data()});
            }
        } else if(filters) {
            let ref = admin.firestore().collection(tableName);
            const filterArr = filters.split(';');
            filterArr.forEach(f => {
                const [field,op, ...rest] = f.split(',');
                let value = rest.join(',');
                
                if(['in', 'not-in', 'array-contains-any'].includes(op)){
                    try {
                        value = JSON.parse(value);
                    } catch {
                        value = value.split('|');
                    }
                }

                if (!isNaN(value) && value.trim() !== '') value = Number(value);
                ref = ref.where(field,op,value);
            });
            const snapshot = await ref.get();
            snapshot.forEach(doc => data.push({id: doc.id, ...doc.data() }));
        } else {
            const snapshot = await admin.firestore().collection(tableName).get();
            snapshot.forEach(doc => data.push({id: doc.id, ...doc.data() }));
        }

        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

// Deletar documento do Firestore
export const deleteFromServer =  async (req,res) => {
    const { tableName, id } = req.params;
    try {
        await admin.firestore().collection(tableName).doc(id).delete();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}