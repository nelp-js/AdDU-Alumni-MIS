import { usePSGC } from '../Hooks/usePSGC';

/**
 * Cascading Region → Province → City dropdowns using PSGC Cloud API.
 *
 * Props:
 *   regionCode      — currently selected region code (e.g. "110000000")
 *   provinceCode    — currently selected province code
 *   cityName        — currently selected city name (stored as plain text)
 *   onChange        — function(field, value) called on any change
 *                     field is one of: "region", "regionCode", "province", "provinceCode", "city"
 *   labelClass      — optional CSS class for <label> elements
 *   fieldClass      — optional CSS class for the wrapper div of each field
 *   inputClass      — optional CSS class for <select> elements
 *   required        — whether fields are required (default true)
 */
function LocationFields({
    regionCode,
    provinceCode,
    cityName,
    onChange,
    labelClass = '',
    fieldClass = '',
    inputClass = '',
    required = true,
}) {
    const { regions, provinces, cities, loadingRegions, loadingProvinces, loadingCities } = usePSGC(regionCode, provinceCode);

    const handleRegion = (e) => {
        const code = e.target.value;
        const name = regions.find((r) => r.code === code)?.name || '';
        onChange('regionCode', code);
        onChange('region', name);
        onChange('provinceCode', '');
        onChange('province', '');
        onChange('city', '');
    };

    const handleProvince = (e) => {
        const code = e.target.value;
        const name = provinces.find((p) => p.code === code)?.name || '';
        onChange('provinceCode', code);
        onChange('province', name);
        onChange('city', '');
    };

    const handleCity = (e) => {
        onChange('city', e.target.value);
    };

    return (
        <>
            <div className={fieldClass}>
                <label className={labelClass}>
                    Region {required && <span style={{ color: '#dc2626' }}>*</span>}
                </label>
                <select
                    value={regionCode || ''}
                    onChange={handleRegion}
                    className={inputClass}
                    required={required}
                    disabled={loadingRegions}
                >
                    <option value="">{loadingRegions ? 'Loading regions...' : 'Select Region'}</option>
                    {regions.map((r) => (
                        <option key={r.code} value={r.code}>{r.name}</option>
                    ))}
                </select>
            </div>

            <div className={fieldClass}>
                <label className={labelClass}>
                    Province {required && <span style={{ color: '#dc2626' }}>*</span>}
                </label>
                <select
                    value={provinceCode || ''}
                    onChange={handleProvince}
                    className={inputClass}
                    required={required}
                    disabled={!regionCode || loadingProvinces}
                >
                    <option value="">
                        {!regionCode ? 'Select a region first' : loadingProvinces ? 'Loading provinces...' : 'Select Province'}
                    </option>
                    {provinces.map((p) => (
                        <option key={p.code} value={p.code}>{p.name}</option>
                    ))}
                </select>
            </div>

            <div className={fieldClass}>
                <label className={labelClass}>
                    City / Municipality {required && <span style={{ color: '#dc2626' }}>*</span>}
                </label>
                <select
                    value={cityName || ''}
                    onChange={handleCity}
                    className={inputClass}
                    required={required}
                    disabled={!provinceCode || loadingCities}
                >
                    <option value="">
                        {!provinceCode ? 'Select a province first' : loadingCities ? 'Loading cities...' : 'Select City / Municipality'}
                    </option>
                    {cities.map((c) => (
                        <option key={c.code} value={c.name}>{c.name}</option>
                    ))}
                </select>
            </div>
        </>
    );
}

export default LocationFields;