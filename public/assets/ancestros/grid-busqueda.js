var gridBusqueda, winGridBusqueda, winGridLayout, winToolbar;
var multi, tpEnti;

IniciarGridBusqueda = (tipoEntidad, multiSelect, container) => {
    return new Promise(resolve => {
        multi = multiSelect;
        tpEnti = tipoEntidad;
        winGridBusqueda = container.dhxWins.createWindow('winGridBusqueda',0,0,720,480);
            winGridBusqueda.center();
            winGridBusqueda.keepInViewport(true);
            winGridBusqueda.setModal(true);
            winGridBusqueda.setText('Búsqueda');
            winGridBusqueda.button('close').hide();
            winGridBusqueda.button('park').hide();
            winGridBusqueda.button('minmax').hide();
            winGridBusqueda.attachStatusBar({
				paging: true,
				text: "<div id='bsq-pager'></div>"
            });
        winToolbar = winGridBusqueda.attachToolbar();
            winToolbar.setIconsPath('/assets/images/icons/');
            winToolbar.addButton('btok', null, 'Confirmar selección', 'ic-add.png', '');
            winToolbar.addButton('btno', null, 'Cancelar', 'ic-delete.png', '');
            winToolbar.disableItem('btok');
            winToolbar.attachEvent('onClick', (id) => {
                switch(id) {
                    case 'btok':
                        var arr_out = [];
                        gridBusqueda.forEachRow((rowId) => {
                            if(gridBusqueda.cells(rowId,0).getValue() == 1) {
                                arr_out.push(generaJsonFila(rowId));
                            }
                        });
                        const out = {
                            seleccion: arr_out
                        };
                        winGridBusqueda.close();
                        resolve(out);
                        break;
                    case 'btno':
                        winGridBusqueda.close();
                        resolve(null);
                        break;
                    default:
                        winGridBusqueda.close();
                        resolve(null);
                        break;
                }
            });
        gridBusqueda = winGridBusqueda.attachGrid();
            switch(tipoEntidad) {
                case 1:
                    gridBusqueda.setHeader('Codigo,Descripción,Vigencia,Observaciones 1,Observaciones 2');
                    gridBusqueda.attachHeader('#numeric_filter,#text_filter,#select_filter,#text_filter,#text_filter');
                    gridBusqueda.setInitWidthsP('10,45,20,10,10');
                    gridBusqueda.setColTypes('ron,rotxt,rotxt,rotxt,rotxt');
                    gridBusqueda.setImagePath("/assets/vendor/dhtmlx/skins/skyblue/imgs/");
                    gridBusqueda.enablePaging(true, 250, 5, "bsq-pager");
                    gridBusqueda.setPagingSkin("toolbar");
                    break;
                default: break;
            }
            gridBusqueda.enableMultiselect(multiSelect);
            gridBusqueda.init();
            gridBusqueda.load('/api/ancestros/datos-modal-busqueda/' + tipoEntidad + '/' + usrJson.empresa, gridBusquedaDatosSuccess);
    });
}

gridBusquedaDatosSuccess = () => {
    gridBusqueda.insertColumn(0,'',multi ? 'ch' : 'ra',5);
    gridBusqueda.uncheckAll();
    gridBusqueda.attachEvent('onRowSelect', gridBusquedaRowSelect);
}

gridBusquedaRowSelect = (rowId, colId) => {
    winToolbar.enableItem('btok');
    const current = parseInt(gridBusqueda.cells(rowId,0).getValue());
    const newValue = (current + 1) % 2;
    gridBusqueda.cells(rowId,0).setValue(newValue);
}

generaJsonFila = (rowId) => {
    switch(tpEnti) {
        case 1:
            return {
                codigo: gridBusqueda.cells(rowId,1).getValue(),
                descripcion: gridBusqueda.cells(rowId,2).getValue(),
                vigencia: gridBusqueda.cells(rowId,3).getValue(),
                observ1: gridBusqueda.cells(rowId,4).getValue(),
                observ2: gridBusqueda.cells(rowId,5).getValue()
            };
        default: return null;
    }
}